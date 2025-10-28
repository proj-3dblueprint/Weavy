import { createContext, useCallback, useContext, useMemo, useState, useRef, PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import noop from 'lodash/noop';
import omitBy from 'lodash/omitBy';
import isNil from 'lodash/isNil';
import { usePostHog } from 'posthog-js/react';
import { log } from '@/logger/logger.ts';
import { AuthContext } from '@/contexts/AuthContext';
import { getAxiosInstance } from '@/services/axiosConfig';
import { UserTourStatus } from '@/enums/user-tour-status.enum';
import { I18N_KEYS } from '@/language/keys';
import { asyncNoop } from '@/utils/functions';
import ConfirmationDialog from '../Common/ConfirmationDialogV2';
import untypedTourConfigs from './tourConfigs.json';
import { Tour } from './Tour';
import { TourKeys } from './tour-keys';
import type { TourDetails, User } from '@/types/auth.types';
import type {
  HookFunction,
  TourAction,
  TourConfig,
  TourConfigs,
  TourContextStore,
  TourCustomDataContext,
} from './tourTypes';

const logger = log.getLogger('TourContext');
const axiosInstance = getAxiosInstance();

export const tourConfigs = untypedTourConfigs as TourConfigs;

export const TourContext = createContext<TourContextStore>({
  activeTour: null,
  allowBack: false,
  callAction: asyncNoop,
  canMoveToNextStep: false,
  checkForEligibleTour: () => null,
  context: undefined,
  currentStep: 0,
  endTour: noop,
  getCurrentStepConfig: () => null,
  goToNextStep: asyncNoop,
  goToPreviousStep: noop,
  goToStep: noop,
  onSuccessAnimationEnd: noop,
  registerPostHookFunction: noop,
  registerPreHookFunction: noop,
  runTour: asyncNoop,
  setActiveComponentId: noop,
  showAnimation: false,
  steps: [],
  stopTour: noop,
  subscribeToTourQuit: noop,
  tourStatus: undefined,
  updateCanMoveToNextStep: noop,
  updateCustomData: noop,
});

export const TourProvider = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const { currentUser } = useContext(AuthContext);
  const [activeComponentId, setActiveComponentId] = useState<string>();
  const [activeTour, setActiveTour] = useState<TourKeys | null>(null);
  const [canMoveToNextStep, setCanMoveToNextStep] = useState(true);
  const [context, setContext] = useState<TourCustomDataContext>();
  const [currentStep, setCurrentStep] = useState(0);
  const [customData, setCustomData] = useState<TourDetails['customData']>();
  const [postHookFunctions, setPostHookFunctions] = useState<Record<string, HookFunction>>({});
  const [preHookFunctions, setPreHookFunctions] = useState<Record<string, HookFunction>>({});
  const [showAnimation, setShowAnimation] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [tourStatus, setTourStatus] = useState<UserTourStatus>();
  const isMovingStepRef = useRef(false);
  const onSuccessAnimationEndRef = useRef(noop);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const posthog = usePostHog();
  const [onQuitTourSubscribers, setOnQuitTourSubscribers] = useState<Record<string, () => void>>({});

  const subscribeToTourQuit = useCallback((id: string, func: () => void) => {
    setOnQuitTourSubscribers((prev) => ({ ...prev, [id]: func }));
  }, []);

  const onSuccessAnimationEnd = useCallback(() => {
    setShowAnimation(false);
    onSuccessAnimationEndRef.current();
    onSuccessAnimationEndRef.current = noop;
  }, []);

  const allowBack = useMemo(() => {
    if (!activeTour || !tourConfigs[activeTour]) return false;
    return tourConfigs[activeTour].allowBack ?? false;
  }, [activeTour]);

  const updateTour = useCallback(async (tourId: TourKeys, data: Partial<TourDetails>) => {
    try {
      await axiosInstance.put(`/v1/users/tours/${tourId}`, omitBy(data, isNil));
    } catch (error) {
      logger.error('Error updating user tour', error);
    }
  }, []);

  const hookRunner = useCallback(
    async (tourId: TourKeys, stepIndex: number, hookType: 'preHook' | 'postHook') => {
      const nextStepConfig = tourConfigs[tourId].steps[stepIndex];
      if (hookType in nextStepConfig && nextStepConfig[hookType]) {
        const hookFunction =
          hookType === 'preHook'
            ? preHookFunctions[nextStepConfig[hookType]]
            : postHookFunctions[nextStepConfig[hookType]];

        if (!hookFunction) {
          logger.error(`${hookType} function "${nextStepConfig[hookType]}" not registered`);
          return; // Don't proceed if hook function is missing
        }

        try {
          await hookFunction();
        } catch (error) {
          logger.error(`Error executing ${hookType}.`, error);
        }
      }
    },
    [preHookFunctions, postHookFunctions],
  );

  const runPreHook = useCallback(
    async (tourId: TourKeys, stepIndex: number) => {
      await hookRunner(tourId, stepIndex, 'preHook');
    },
    [hookRunner],
  );

  const runPostHook = useCallback(
    async (tourId: TourKeys, stepIndex: number) => {
      await hookRunner(tourId, stepIndex, 'postHook');
    },
    [hookRunner],
  );

  const getEligibleTours = useCallback(
    (componentId: string, userPendingTours?: User['tours']): [TourKeys, TourConfig][] => {
      if (!userPendingTours || Object.keys(userPendingTours).length === 0) return [];

      // Object entries cannot accept typed keys, so we need to cast to [TourKeys, TourConfig]
      return (Object.entries(tourConfigs) as [TourKeys, TourConfig][])
        .filter(([tourId, config]) => {
          return config.componentId === componentId && userPendingTours[tourId];
        })
        .sort((a, b) => (a[1].priority ?? Infinity) - (b[1].priority ?? Infinity));
    },
    [],
  );

  const findActiveTourIndex = useCallback((eligibleTours: [TourKeys, TourConfig][], activeTourId: TourKeys) => {
    return eligibleTours.findIndex(([tourId]) => tourId === activeTourId);
  }, []);

  const checkForEligibleTour = useCallback(
    (componentId?: string) => {
      const componentIdToUse = componentId || activeComponentId;
      if (!currentUser?.tours || Object.keys(currentUser.tours).length === 0 || !componentIdToUse) return null;
      const eligibleTours = getEligibleTours(componentIdToUse, currentUser.tours);

      const tourToShow = eligibleTours?.[0];
      if (!tourToShow) return null;
      const userDataTour = currentUser.tours[tourToShow[0]];
      const pendingTourCurrentStep = userDataTour?.currentStep;

      if (tourToShow && pendingTourCurrentStep !== undefined && userDataTour.status !== UserTourStatus.COMPLETED) {
        return {
          tourId: tourToShow[0],
          currentStep: pendingTourCurrentStep,
          customData: userDataTour.customData,
        };
      }
      return null;
    },
    [activeComponentId, currentUser?.tours, getEligibleTours],
  );

  const updateServerOnTourEndOrQuit = useCallback(
    async (tourId: TourKeys) => {
      try {
        setTourStatus(UserTourStatus.COMPLETED);
        await updateTour(tourId, { status: UserTourStatus.COMPLETED });
      } catch (error) {
        logger.error('Error updating user tour', error);
      }
    },
    [updateTour],
  );

  const stopTour = useCallback(() => {
    setActiveTour(null);
    setCurrentStep(0);
    setCanMoveToNextStep(false);
    setTourStatus(undefined);
    Object.values(onQuitTourSubscribers).forEach((subscriber) => subscriber());
  }, [onQuitTourSubscribers]);

  const handleQuitTour = useCallback(
    async (tourId: TourKeys) => {
      setShowQuitDialog(false);
      posthog.capture('product_tour_end', {
        tour: tourId,
      });
      await updateServerOnTourEndOrQuit(tourId);
      stopTour();
    },
    [posthog, updateServerOnTourEndOrQuit, stopTour],
  );

  const registerPreHookFunction = useCallback((functionName: string, handler: HookFunction) => {
    setPreHookFunctions((prev) => ({
      ...prev,
      [functionName]: handler,
    }));
  }, []);

  const registerPostHookFunction = useCallback((functionName: string, handler: HookFunction) => {
    setPostHookFunctions((prev) => ({
      ...prev,
      [functionName]: handler,
    }));
  }, []);

  const updateContext = useCallback(
    (newContext: TourCustomDataContext, allowUpdateTour = true) => {
      if (!activeTour && !allowUpdateTour) return;
      setContext((prev) => {
        if (!prev) return newContext;
        return { ...prev, ...newContext };
      });
      const tourId = activeTour || (Object.keys(newContext)[0] as TourKeys);
      const newCustomData = { ...customData, context: newContext[tourId] };
      void updateTour(tourId, { customData: newCustomData });
      setCustomData(newCustomData);
    },
    [activeTour, customData, updateTour],
  );

  const updateCustomData = useCallback(
    (newCustomData: TourDetails['customData']) => {
      if (!activeTour) return;
      setCustomData(newCustomData);
      void updateTour(activeTour, { customData: newCustomData });
    },
    [activeTour, updateTour],
  );

  const runTour = useCallback(
    async (tourId: TourKeys, step: number, customData?: TourDetails['customData']) => {
      if (tourConfigs[tourId]) {
        await runPreHook(tourId, step);
        setActiveTour(tourId);
        setCurrentStep(step);
        setTourStatus(UserTourStatus.IN_PROGRESS);
        if (customData) {
          setCustomData(customData);
          if (customData.context) {
            updateContext({ [tourId]: customData.context });
          }
        }
      }
    },
    [runPreHook, updateContext],
  );

  const goToNextTour = useCallback(async () => {
    const activeTourBeforeQuit = activeTour;
    if (!activeTourBeforeQuit || !activeComponentId) return;
    await handleQuitTour(activeTourBeforeQuit);
    const eligibleTours = getEligibleTours(activeComponentId, currentUser?.tours);
    const nextTour = eligibleTours[findActiveTourIndex(eligibleTours, activeTourBeforeQuit) + 1];
    if (nextTour && nextTour[0]) {
      setActiveTour(nextTour[0]);
      setCurrentStep(0);
      await runTour(nextTour[0], 0);
    }
  }, [
    activeTour,
    activeComponentId,
    currentUser?.tours,
    findActiveTourIndex,
    getEligibleTours,
    handleQuitTour,
    runTour,
  ]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (!activeTour || !tourConfigs[activeTour]) return;
      if (stepIndex >= 0 && stepIndex < tourConfigs[activeTour].steps.length) {
        void runPreHook(activeTour, stepIndex);
        setCurrentStep(stepIndex);
        setCanMoveToNextStep(tourConfigs[activeTour].steps[stepIndex].noTask ?? true);
        void updateTour(activeTour, {
          status: UserTourStatus.IN_PROGRESS,
          currentStep: stepIndex,
          customData,
        });
      }
    },
    [activeTour, customData, runPreHook, updateTour],
  );

  const goToNextStep = useCallback(async () => {
    if (!activeTour || !tourConfigs[activeTour]) return;
    if (currentStep < tourConfigs[activeTour].steps.length - 1) {
      void runPostHook(activeTour, currentStep);
      void runPreHook(activeTour, currentStep + 1);
      setCurrentStep((prev) => prev + 1);
      setCanMoveToNextStep(tourConfigs[activeTour].steps[currentStep + 1].noTask ?? true);
      void updateTour(activeTour, {
        status: UserTourStatus.IN_PROGRESS,
        currentStep: currentStep + 1,
        customData,
      });
    } else {
      // End tour if we're at the last step
      await goToNextTour();
    }
  }, [activeTour, currentStep, customData, goToNextTour, runPostHook, runPreHook, updateTour]);

  const goToPreviousStep = useCallback(() => {
    if (!activeTour || !tourConfigs[activeTour]) return;
    if (currentStep > 0) {
      void runPreHook(activeTour, currentStep - 1);
      setCurrentStep((prev) => prev - 1);
      setCanMoveToNextStep(tourConfigs[activeTour].steps[currentStep - 1].noTask ?? true);
      void updateTour(activeTour, {
        status: UserTourStatus.IN_PROGRESS,
        currentStep: currentStep - 1,
        customData,
      });
    }
  }, [activeTour, currentStep, customData, runPreHook, updateTour]);

  const updateCanMoveToNextStep = useCallback(
    (newCanMoveToNextStep: boolean) => {
      if (!activeTour || !tourConfigs[activeTour]) return;
      setCanMoveToNextStep(newCanMoveToNextStep);
      if (newCanMoveToNextStep) {
        const autoPass = tourConfigs[activeTour].steps[currentStep].autoPass;
        if (autoPass && !isMovingStepRef.current) {
          isMovingStepRef.current = true;
          const delayedMoveStep = async () => {
            await goToNextStep();
            isMovingStepRef.current = false;
          };
          if (tourConfigs[activeTour].steps[currentStep].showSuccessAnimation) {
            onSuccessAnimationEndRef.current = () => void delayedMoveStep();
            setShowAnimation(true);
          } else {
            // run the next step after half a second delay
            timeoutRef.current = setTimeout(() => void delayedMoveStep(), 500);
          }
        }
      }
    },
    [activeTour, currentStep, goToNextStep],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const endTour = useCallback(() => {
    setShowQuitDialog(true);
  }, []);

  const callAction = useCallback(
    async (action: TourAction) => {
      if (!activeTour) return;
      if (action.onClick === 'setContext') {
        if (!action.context) return;
        updateContext({ [activeTour]: action.context });
        await goToNextStep();
      } else if (action.onClick === 'nextTour') {
        await goToNextTour();
      } else if (action.onClick === 'closeTour') {
        stopTour();
      } else if (action.onClick === 'endTour') {
        await handleQuitTour(activeTour);
      } else if (action.onClick === 'nextStep') {
        await goToNextStep();
      } else if (action.onClick === 'previousStep') {
        goToPreviousStep();
      }
    },
    [activeTour, goToNextStep, goToNextTour, goToPreviousStep, handleQuitTour, stopTour, updateContext],
  );

  const steps = useMemo(() => {
    if (!activeTour) return [];
    return tourConfigs[activeTour].steps;
  }, [activeTour]);

  const getCurrentStepConfig = useCallback(() => {
    if (!steps.length) return null;
    return steps[currentStep];
  }, [currentStep, steps]);

  const value: TourContextStore = useMemo(
    () => ({
      activeTour,
      allowBack,
      callAction,
      canMoveToNextStep,
      checkForEligibleTour,
      context,
      currentStep,
      endTour,
      getCurrentStepConfig,
      goToNextStep,
      goToPreviousStep,
      goToStep,
      onSuccessAnimationEnd,
      registerPostHookFunction,
      registerPreHookFunction,
      runTour,
      setActiveComponentId,
      showAnimation,
      steps,
      stopTour,
      subscribeToTourQuit,
      tourStatus,
      updateCanMoveToNextStep,
      updateCustomData,
    }),
    [
      activeTour,
      allowBack,
      callAction,
      canMoveToNextStep,
      checkForEligibleTour,
      context,
      currentStep,
      endTour,
      getCurrentStepConfig,
      goToNextStep,
      goToPreviousStep,
      goToStep,
      onSuccessAnimationEnd,
      registerPostHookFunction,
      registerPreHookFunction,
      runTour,
      showAnimation,
      steps,
      stopTour,
      subscribeToTourQuit,
      tourStatus,
      updateCanMoveToNextStep,
      updateCustomData,
    ],
  );

  return (
    <>
      <TourContext.Provider value={value}>
        {activeTour ? (
          <>
            <Tour />
            <ConfirmationDialog
              open={showQuitDialog}
              title={t(I18N_KEYS.PRODUCT_TOURS.QUIT_TOUR_CONFIRMATION_MESSAGE)}
              confirmText={t(I18N_KEYS.PRODUCT_TOURS.QUIT_TOUR_CONFIRMATION_CANCEL)}
              cancelText={t(I18N_KEYS.PRODUCT_TOURS.QUIT_TOUR_CONFIRMATION_CTA)}
              onConfirm={() => setShowQuitDialog(false)}
              onClose={() => setShowQuitDialog(false)}
              onCancel={() => void handleQuitTour(activeTour)}
            />
          </>
        ) : null}
        {children}
      </TourContext.Provider>
    </>
  );
};

export const useTour = (): TourContextStore => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
