import { useCallback, useMemo, useRef, forwardRef, ChangeEvent, ReactNode, DragEvent, useEffect, memo } from 'react';
import { Box, CircularProgress, Grid2, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenHorVer, FlexCenVer, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { color, EL_COLORS } from '@/colors';
import { StepKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import { Input } from '@/UI/Input/Input';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { ModelItem } from '@/state/nodes/nodes.types';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { WorkflowDesignAppSwitch } from './WorkflowDesignAppSwitch/WorkflowDesignAppSwitch';
import { LeftPanelMenuItem } from './LeftPanelSections/LeftPanelMenuItem';
import { MediaLibrarySection } from './LeftPanelSections/MediaLibrarySection';
import { InputOutputFilter } from './LeftPanelSections/InputOutputFilter';
import { Section } from './LeftPanelSections/Section';
import { SortMenu } from './LeftPanelSections/SortMenu';
import { MenuSection } from './LeftToolMenuV2';
import type { MediaAsset } from '@/types/api/assets';

const FLUX_FAST_ID = 'zE9WAgeGgEYnZmIspEGn';

interface CustomTabPanelProps {
  id: MenuSection;
  title: string;
  mt?: number;
  children: ReactNode;
}

const CustomTabPanel = forwardRef<HTMLDivElement, CustomTabPanelProps>(({ id, title, children, mt, ...props }, ref) => {
  return (
    <Box
      ref={ref}
      role="tabpanel"
      data-testid={`simple-tabpanel-${id}`}
      aria-labelledby={`simple-tab-${id}`}
      mt={mt || 0}
      {...props}
    >
      <Typography component="div" sx={{ mb: 2 }} variant="body-lg-md">
        {title}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
});
CustomTabPanel.displayName = 'CustomTabPanel';

interface LeftPanelProps {
  selectedMenu: MenuSection;
  shouldHidePanel: boolean;
  mediaArray: any[];
  setSelectedItem: (item: MenuSection) => void;
  lastMenuChangeByUser: React.MutableRefObject<boolean>;
  justScrolledRef: React.MutableRefObject<boolean>;
}

const sectionIndexMap: Record<MenuSection, number> = {
  search: -2,
  recent: -1,
  toolbox: 0,
  image: 1,
  video: 2,
  threedee: 3,
  models: 4,
  files: 5,
};

const LeftPanelV2 = memo(function LeftPanelV2({
  selectedMenu,
  setSelectedItem,
  lastMenuChangeByUser,
  justScrolledRef,
  // shouldHidePanel,
}: LeftPanelProps) {
  // const [searchResults, setSearchResults] = useState<MenuItem[]>([]);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { getCurrentStepConfig } = useTour();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { filters, setSearch, setSource, menu, filteredMenuData, isFiltersActive, isMenuDataLoaded, resetFilters } =
    useNodeFiltersStore();

  const { modelBlockingPermissions } = useSubscriptionPermissions();
  const isInRelevantTourStage = useMemo(
    () => getCurrentStepConfig()?.stepId === StepKeys.NAVIGATION_TOUR.ADD_NODES,
    [getCurrentStepConfig],
  );

  useEffect(() => {
    if (!selectedMenu) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }
    if (justScrolledRef.current) {
      justScrolledRef.current = false;
      return;
    }
    const sectionIdx = sectionIndexMap[selectedMenu];
    const sectionRef = sectionRefs.current[sectionIdx];

    if (lastMenuChangeByUser.current || isInRelevantTourStage) {
      lastMenuChangeByUser.current = false;
      if (sectionRef) {
        timeoutRef.current = setTimeout(() => {
          scrollContainerRef?.current?.scrollTo({ top: sectionRef.offsetTop - 16, behavior: 'auto' });
        }, 50);
        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }
    }
  }, [selectedMenu, justScrolledRef, lastMenuChangeByUser, isInRelevantTourStage]);

  useEffect(() => {
    if (!selectedMenu || selectedMenu === 'search') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const containerTop = container.getBoundingClientRect().top;
        let currentSection: MenuSection | null = null;
        (Object.entries(sectionIndexMap) as [MenuSection, number][]).forEach(([menu, idx]) => {
          const ref = sectionRefs.current[idx];
          if (ref) {
            const rect = ref.getBoundingClientRect();
            if (rect.top - containerTop <= 40) {
              // 40px threshold for header
              currentSection = menu;
            }
          }
        });
        if (currentSection && currentSection !== selectedMenu) {
          lastMenuChangeByUser.current = false;
          justScrolledRef.current = true;
          setSelectedItem(currentSection);
        }
        ticking = false;
      });
    };
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [setSelectedItem, selectedMenu, lastMenuChangeByUser, justScrolledRef]);

  const getShouldDisable = useCallback(
    (itemId) => isInRelevantTourStage && itemId !== FLUX_FAST_ID,
    [isInRelevantTourStage],
  );

  const getIsSelected = useCallback(
    (itemId) => isInRelevantTourStage && itemId === FLUX_FAST_ID,
    [isInRelevantTourStage],
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, item) => {
    const itemString = JSON.stringify(item);
    e.dataTransfer.setData('menuItem', itemString);
    e.dataTransfer.effectAllowed = 'move';
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('dragging');
    }
    document.body.style.cursor = 'grabbing';
  };

  const onDragFileStart = (e: DragEvent<HTMLDivElement>, file: MediaAsset) => {
    const item = {
      type: 'import',
      initialData: file,
      id: 'wkKkBSd0yrZGwbStnU6r',
    };
    const itemString = JSON.stringify(item);
    e.dataTransfer.setData('menuItem', itemString);
    e.dataTransfer.effectAllowed = 'move';
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('dragging');
    }
    document.body.style.cursor = 'grabbing';
  };

  const onDragEnd = (e: DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('dragging');
    }
    document.body.style.cursor = '';
  };

  const renderSearchResults = (results: ModelItem[]) => {
    if (!results?.length) {
      return (
        <Typography variant="body-sm-rg" sx={{ textAlign: 'center', py: 2 }} color={color.White64_T}>
          {t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.SEARCH.EMPTY)}
        </Typography>
      );
    }

    return (
      <Box className="wea-no-scrollbar" sx={{ overflowY: 'scroll', flex: 1, py: 2 }}>
        <Grid2 container spacing={1}>
          {results.map((item, i) => (
            <Grid2 key={`${item.id}-${i}`} size={6}>
              <LeftPanelMenuItem
                item={item}
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
                disabled={getShouldDisable(item.id)}
              />
            </Grid2>
          ))}
        </Grid2>
      </Box>
    );
  };

  return (
    <Box
      // TODO: cleanup css of #flow-left-panel when merge
      data-testid="flow-left-panel"
      // className={!shouldHidePanel && selectedMenu ? 'slide-left-enter' : 'slide-left-exit'}
      sx={{
        height: '100%',
        background: color.Black92,
        borderRight: `1px solid ${EL_COLORS.BoxBorder}`,
      }}
    >
      <FlexCenHorVer sx={{ height: '72px', borderBottom: `1px solid ${EL_COLORS.BoxBorder}` }}>
        <WorkflowDesignAppSwitch isPaperBg={false} hideDevLabel />
      </FlexCenHorVer>
      {selectedMenu !== 'files' && (
        <FlexCol sx={{ py: 2.5, borderBottom: `1px solid ${EL_COLORS.BoxBorder}`, gap: 1.5 }}>
          <FlexCenVer sx={{ px: 2, gap: 1, justifyContent: 'space-between' }}>
            <Input
              size="small"
              fullWidth={!isFiltersActive}
              sx={{ height: 24 }}
              value={filters.search}
              placeholder={t(I18N_KEYS.GENERAL.SEARCH)}
              onChange={handleSearchChange}
              startAdornment={<SearchIcon />}
              onFocus={() => setSelectedItem('search')}
            />
            {isFiltersActive && (
              <ButtonContained
                onClick={resetFilters}
                sx={{ height: 24, width: 32, minWidth: 40, p: 0.5 }}
                mode="text"
                size="small"
              >
                {t(I18N_KEYS.GENERAL.CLEAR)}
              </ButtonContained>
            )}
          </FlexCenVer>
          {selectedMenu === 'search' && (
            <>
              <FlexCenVer sx={{ px: 2 }}>
                <InputOutputFilter />
              </FlexCenVer>
              <FlexCenVer sx={{ px: 2, gap: 1 }}>
                <AppToggleButtons
                  sx={{ width: 180 }}
                  gap={0}
                  mode="contained"
                  value={filters.source}
                  options={[
                    { value: 'all', label: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.MODE_TOGGLE.ALL) },
                    {
                      value: 'tools_only',
                      label: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.MODE_TOGGLE.TOOLS),
                    },
                    {
                      value: 'models_only',
                      label: t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.FILTERS.MODE_TOGGLE.MODELS),
                    },
                  ]}
                  onChange={(value) => {
                    if (value) {
                      setSource(value);
                    }
                  }}
                />
                <SortMenu />
              </FlexCenVer>
            </>
          )}
        </FlexCol>
      )}
      {isMenuDataLoaded ? (
        <FlexCol sx={{ height: `calc(100% - 72px - ${selectedMenu === 'search' ? 130 : 65}px)`, px: 2 }}>
          {isFiltersActive ? (
            renderSearchResults(filteredMenuData)
          ) : (
            <Box
              ref={scrollContainerRef}
              sx={{ position: 'relative', flex: 1, overflowY: 'scroll', scrollbarWidth: 'none', py: 2 }}
            >
              {selectedMenu !== 'files' && (
                <>
                  {menu.recent.children?.length > 0 && (
                    <CustomTabPanel
                      ref={(el: HTMLDivElement | null) => (sectionRefs.current[-1] = el)}
                      title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.RECENT)}
                      id="recent"
                    >
                      <Section
                        node={menu.recent}
                        onDragEnd={onDragEnd}
                        onDragStart={onDragStart}
                        getShouldDisable={getShouldDisable}
                        getIsSelected={getIsSelected}
                        hideTitle
                      />
                    </CustomTabPanel>
                  )}
                  {/* toolbox */}
                  <CustomTabPanel
                    ref={(el: HTMLDivElement | null) => (sectionRefs.current[0] = el)}
                    title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.TOOLBOX)}
                    id="toolbox"
                  >
                    <Section
                      node={menu.tools}
                      onDragEnd={onDragEnd}
                      onDragStart={onDragStart}
                      getShouldDisable={getShouldDisable}
                      getIsSelected={getIsSelected}
                      hideTitle
                    />
                  </CustomTabPanel>
                  {/* models */}
                  {/* image models */}
                  <CustomTabPanel
                    ref={(el: HTMLDivElement | null) => (sectionRefs.current[1] = el)}
                    title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.IMAGE)}
                    id="image"
                    mt={5}
                  >
                    <Section
                      node={menu.imageModels}
                      onDragEnd={onDragEnd}
                      onDragStart={onDragStart}
                      getShouldDisable={getShouldDisable}
                      getIsSelected={getIsSelected}
                      hideTitle
                    />
                  </CustomTabPanel>
                  {/* video models */}
                  <CustomTabPanel
                    ref={(el: HTMLDivElement | null) => (sectionRefs.current[2] = el)}
                    title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.VIDEO)}
                    id="video"
                    mt={5}
                  >
                    <Section
                      node={menu.videoModels}
                      onDragEnd={onDragEnd}
                      onDragStart={onDragStart}
                      getShouldDisable={getShouldDisable}
                      getIsSelected={getIsSelected}
                      hideTitle
                    />
                  </CustomTabPanel>
                  {/* 3d */}
                  <CustomTabPanel
                    ref={(el: HTMLDivElement | null) => (sectionRefs.current[3] = el)}
                    title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.THREEDEE)}
                    id="threedee"
                    mt={5}
                  >
                    <Section
                      node={menu.threedModels}
                      onDragEnd={onDragEnd}
                      onDragStart={onDragStart}
                      getShouldDisable={getShouldDisable}
                      getIsSelected={getIsSelected}
                      hideTitle
                    />
                  </CustomTabPanel>
                  {/* custom models */}
                  {!modelBlockingPermissions.view && (
                    <CustomTabPanel
                      ref={(el: HTMLDivElement | null) => (sectionRefs.current[4] = el)}
                      title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.MY_MODELS)}
                      id="models"
                      mt={5}
                    >
                      <Section
                        node={menu.customModels}
                        onDragEnd={onDragEnd}
                        onDragStart={onDragStart}
                        getShouldDisable={getShouldDisable}
                        getIsSelected={getIsSelected}
                        isLast
                        hideTitle
                      />
                    </CustomTabPanel>
                  )}
                </>
              )}
              {/* media library */}
              {selectedMenu === 'files' && (
                <CustomTabPanel title={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_TOOLS_PANEL.TITLE.MEDIA)} id="files">
                  <MediaLibrarySection onDragFileStart={onDragFileStart} onDragEnd={onDragEnd} />
                </CustomTabPanel>
              )}
            </Box>
          )}
        </FlexCol>
      ) : (
        <FlexCenHorVer sx={{ height: '100%' }}>
          <CircularProgress sx={{ color: color.White100 }} size={32} />
        </FlexCenHorVer>
      )}
    </Box>
  );
});

export default LeftPanelV2;
