top/
├── app.weavy.ai/
│   ├── assets/
│   │   ├── designer-DqJHv1UD.js
│   │   ├── designer_bg-DPmJP8xE.wasm
│   │   ├── index-DnvAWuNV.js
│   │   ├── react-vendor-C6Ba5J37.js
│   │   ├── three-CCuf2VqA.js
│   │   ├── three-stdlib-DgqlzYJm.js
│   │   └── index-D4TW7wuV.css
│   ├── flow/
│   │   └── i1duC9kjnRBvtFTQrecSqh
│   ├── icons/
│   ├── menu-images/
│   ├── node_modules/
│   └── src/
│       ├── UI/
│       │   ├── Animations/
│       │   ├── AppCheckbox/
│       │   ├── AppContextMenu/
│       │   ├── AppSnackbar/
│       │   ├── AppSwitch/
│       │   ├── AppToggleButtons/
│       │   ├── AppXBtn/
│       │   ├── BaseSelect/
│       │   ├── ButtonTextPlain/
│       │   ├── Buttons/
│       │   ├── ColorPicker/
│       │   ├── Counter/
│       │   ├── Dropdown/
│       │   ├── EllipsisText/
│       │   ├── ErrorSnackbar/
│       │   ├── FloatingPanel/
│       │   ├── Icons/
│       │   ├── Input/
│       │   ├── Label/
│       │   ├── Menu/
│       │   ├── MultiSelect/
│       │   ├── NodeTextField/
│       │   ├── PanelField/
│       │   ├── ReloadAlert/
│       │   ├── Tag/
│       │   ├── TextArea/
│       │   ├── ThreeHandleSlider/
│       │   ├── UnitInput/
│       │   ├── VideoAudio/
│       │   ├── styles.ts
│       │   └── theme.ts
│       ├── components/
│       │   ├── ActionsBar/
│       │   ├── AxiosConfiguration/
│       │   ├── CancellableLoadingButton/
│       │   ├── Common/
│       │   ├── Dashboard/
│       │   ├── DashboardHeader/
│       │   ├── DownloadBtn/
│       │   ├── ErrorBoundary/
│       │   ├── Errors/ErrorPage
│       │   ├── GridViewer/
│       │   ├── Homepage/
│       │   ├── MediaPlayerControls/
│       │   ├── Menu/
│       │   ├── MobileCheck/
│       │   ├── Nodes/
│       │   ├── PermissionsContainer/
│       │   ├── ProductTours/
│       │   ├── Recipe/
│       │   └── ShortcutsPanel/
│       │   └── SubscriptionsAndPayments/
│       ├── consts/
│       │   ├── auth.consts.ts
│       │   ├── dimensions.ts
│       │   ├── externalLinks.consts.ts
│       │   ├── featureFlags.ts
│       │   ├── headers.ts
│       │   ├── node-types.consts.ts
│       │   ├── recipe-poster.ts
│       │   ├── routes.consts.ts
│       │   └── shortcuts.ts
│       ├── contexts/
│       │   └── AuthContext.tsx
│           └── QueryParamsContext.tsx
│       ├── designer/
│       │   └── designer.js
│       ├── enums/
│       │   ├── design-app-modes.enum.ts
│       │   ├── flow-modes.enum.ts
│       │   ├── folder-scope.enum.ts
│       │   ├── handle-type.enum.ts
│       │   ├── model-type.enum.ts
│       │   ├── node-type.enum.ts
│       │   ├── node-view-mode.enum.ts
│       │   ├── pricing-page.enum.ts
│       │   ├── recipe-type.enum.ts
│       │   ├── recipe-visibility-type.ts
│       │   ├── settings-page-sections.enum.ts
│       │   ├── team-member-status.enum.ts
│       │   ├── tour-step-media-type.enum.ts
│       │   └── user-tour-status.enum.ts
│       ├── hooks/
│       │   ├── nodes/
│       │   ├── useAnalytics.ts
│       │   ├── useAuthConfig.ts
│       │   ├── useContentRect.tsx
│       │   ├── useCopyToClipboard.ts
│       │   ├── useDeepEqualMemo.ts
│       │   ├── useDeleteEdgeOnSwipe.ts
│       │   ├── useDragAndDrop.ts
│       │   ├── useGetCost.tsx
│       │   ├── useHotkeyScope.ts
│       │   ├── useHotkeysUniqueScope.ts
│       │   ├── useIsHovered.tsx
│       │   ├── useKeyNavigation.ts
│       │   ├── useKeyState.ts
│       │   ├── useLocalStorage.ts
│       │   ├── useMousePosition.tsx
│       │   ├── useNumberInput.tsx
│       │   ├── useOnMount.ts
│       │   ├── usePrecedingIterators.ts
│       │   ├── usePrevious.ts
│       │   ├── useProximityConnect.ts
│       │   ├── useReactFlowCenterPosition.ts
│       │   ├── useSaveRecipe.tsx
│       │   ├── useSocket.tsx
│       │   ├── useSubscriptionPermissions.tsx
│       │   ├── useUploadMediaAsset.ts
│       │   ├── useVirtualElement.ts
│       │   └── useWithLoader.tsx
│       ├── language/
│       │   ├── en.ts
│       │   ├── index.ts
│       │   ├── keys.ts
│       │   ├── languages.ts
│       │   ├── node-parameters.en.ts
│       │   └── node-parameters.keys.ts
│       ├── logger/
│       │   ├── console-log.middleware.ts
│       │   ├── log-formatter.middleware.ts
│       │   ├── logger.ts
│       │   └── logs-collector.middleware.ts
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── FileViewer.jsx
│       │   ├── PricingTablePage.tsx
│       │   ├── Recipe.tsx
│       │   ├── Settings.tsx
│       │   ├── SignInPage.tsx
│       │   └── TeamInviteActivationPage.tsx
│       ├── providers/
│       │   ├── intercom.ts
│       │   ├── posthog.ts
│       │   ├── rudderstack.ts
│       │   └── useWhatChanged.ts
│       ├── services/
│       │   ├── auth/
│       │   │   ├── descope/
│       │   │   ├── firebase/
│       │   │   └── auth-errors.ts
│       │   ├── CreditsContext.tsx
│       │   ├── axiosConfig.ts
│       │   ├── firebase.ts
│       │   └── traceIdManager.ts
│       ├── state/
│       │   ├── nodes/
│       │   │   ├── nodes-parser.ts
│       │   │   ├── nodes.state.ts
│       │   │   └── nodes.utils.ts
│       │   ├── customModels.state.ts
│       │   ├── dashboardRecipes.state.ts
│       │   ├── folders.state.ts
│       │   ├── global.state.ts
│       │   ├── settings.state.ts
│       │   ├── user.state.ts
│       │   ├── workflow.state.ts
│       │   └── workspaces.state.ts
│       ├── types/
│       │   ├── api/
│       │   │   └── assets.ts
│       │   ├── auth.types.ts
│       │   ├── node.ts
│       │   └── shared.ts
│       ├── utils/
│       │   ├── analytics.ts
│       │   ├── date.utils.ts
│       │   ├── fileTypes.ts
│       │   ├── fileUploadUtils.ts
│       │   ├── files.ts
│       │   ├── flow.ts
│       │   ├── folder.utils.ts
│       │   ├── functions.ts
│       │   ├── general.ts
│       │   ├── iterator.utils.ts
│       │   ├── listNode.ts
│       │   ├── loraUploadUtils.ts
│       │   ├── mediaPlaying.ts
│       │   ├── nodeDataValidator.ts
│       │   ├── nodeInputValidation.ts
│       │   ├── numbers.ts
│       │   ├── search.ts
│       │   ├── shortcuts.ts
│       │   ├── strings.utils.ts
│       │   └── urls.ts
│       ├── App.tsx
│       ├── ProtectedRoutes.tsx
│       ├── Router.tsx
│       ├── colors.ts
│       ├── globals.ts
│       └── main.tsx
├── React Developer Tools/
├── cdn.firstpromoter.com/
├── cdn.rudderlabs.com/
├── js.stripe.com/
├── kit.fontawesome.com/
├── media.weavy.ai/
├── posthog-proxy.weavy.ai/
├── static.cloudflareinsights.com/
├── webpack:///
├── widget.intercom.io/
├── www.googletagmanager.com/
├── about:blank/
└── intercom-frame (about:blank)/

7f2974e4-4b06-45b3-922e-ed4b69b578c9/
9ba6150b-bca4-446a-a842-11fa574f46f6/
9cfe7dae-453f-4050-9885-6dd099999d10/
678ba2b6-1d15-4795-a047-8815af857f48/
a6f887cb-5583-4a8e-a696-b1920cd4db93/
a11383c5-142d-4f97-9b4c-b851158bfc5/
f2d43477-ac4d-4a68-8048-b109f7d2ec65/
sw.js 
sw.js 
sw.js 
sw.js 
sw.js 
sw.js 