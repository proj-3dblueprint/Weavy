import { Box } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexCenVer } from '@/UI/styles';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { color } from '../../colors';
import { I18N_KEYS } from '../../language/keys';
import { Arrow } from './ArrowScroll';
import EducationGalleryCard from './EducationGallery/EducationGalleryCard';

const tutorials = [
  {
    id: '00',
    poster: 'https://media.weavy.ai/image/upload/v1748958081/product/assets/tutorials_posters/Intro_s89joq.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=YGx90x8XaHI?utm_source=weavy_gallery',
    name: 'Introduction to Weavy',
    order: 0,
  },
  {
    id: '10',
    poster:
      'https://media.weavy.ai/image/upload/v1751201353/product/assets/tutorials_posters/gr5rtbqs7jevqrku1rep.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=wMTqdtTexe4?utm_source=weavy_gallery',
    name: 'Weavy 101',
    order: 10,
  },

  {
    id: '20',
    poster: 'https://media.weavy.ai/image/upload/v1748958081/product/assets/tutorials_posters/Tutorial_1_pd4ykx.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=ihOFi5lpQr8?utm_source=weavy_gallery',
    name: 'Build Your First AI Workflow',
    order: 20,
  },
  {
    id: '30',
    poster: 'https://media.weavy.ai/image/upload/v1748958081/product/assets/tutorials_posters/Tutorial_2_ou1f3v.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=zQGutL3RZbU?utm_source=weavy_gallery',
    name: 'The Compositor',
    order: 30,
  },
  {
    id: '40',
    poster: 'https://media.weavy.ai/image/upload/v1748958081/product/assets/tutorials_posters/Tutorial_3_tm7uah.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=9uTXPdZbidc?utm_source=weavy_gallery',
    name: 'Using 3D Models',
    order: 40,
  },
  {
    id: '50',
    poster: 'https://media.weavy.ai/image/upload/v1748958079/product/assets/tutorials_posters/Tutorial_4_bhmk8b.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=aEoHwSdWWWM?utm_source=weavy_gallery',
    name: 'From Workflow to App',
    order: 50,
  },
  {
    id: '60',
    poster:
      'https://media.weavy.ai/image/upload/v1748958081/product/assets/tutorials_posters/Export_import_jkcsbz.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=UxOsCyHmCEM?utm_source=weavy_gallery',
    name: 'Export and Import',
    order: 60,
  },
  {
    id: '70',
    poster:
      'https://media.weavy.ai/image/upload/v1748958080/product/assets/tutorials_posters/Master_generative_models_h15xsd.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=ykniduApncM?utm_source=weavy_gallery',
    name: 'Master Generative Models',
    order: 70,
  },
  {
    id: '80',
    poster:
      'https://media.weavy.ai/image/upload/v1748958080/product/assets/tutorials_posters/Import_LoRa_model_kgieyn.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=r_Yzt2jqyzs?utm_source=weavy_gallery',
    name: 'Import LoRA Models',
    order: 80,
  },
  {
    id: '90',
    poster:
      'https://media.weavy.ai/image/upload/v1748958080/product/assets/tutorials_posters/Mastering_text_prompts_pkwxuy.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=OXyPhupm2bU?utm_source=weavy_gallery',
    name: 'Mastering Text Prompts',
    order: 90,
  },
  {
    id: '100',
    poster:
      'https://media.weavy.ai/image/upload/v1748958079/product/assets/tutorials_posters/Bring_external_models_jyx0x8.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=tBIjC5BUGg0?utm_source=weavy_gallery',
    name: 'Bring External Models',
    order: 100,
  },
  {
    id: '110',
    poster: 'https://media.weavy.ai/image/upload/v1748958079/product/assets/tutorials_posters/Controlnet_rbc8ko.avif',
    icon: <i className="fa-solid fa-circle-play fa-2x"></i>,
    url: 'https://www.youtube.com/watch?v=mWRnijpv2pw?utm_source=weavy_gallery',
    name: 'ControlNet',
    order: 110,
  },
];

interface ShowCaseRecipesListProps {
  recipes: any[];
}

const enum EducationGalleryTabs {
  WORKFLOWS = 'workflows',
  TUTORIALS = 'tutorials',
}

function EducationGallery({ recipes }: ShowCaseRecipesListProps) {
  const [showLeftScrollArrow, setShowLeftScrollArrow] = useState(false);
  const [showRightScrollArrow, setShowRightScrollArrow] = useState(false);
  const [selectedTab, setSelectedTab] = useState(EducationGalleryTabs.WORKFLOWS);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { track } = useAnalytics();
  useEffect(() => {
    const handleScroll = () => updateScrollArrows();

    const handleWheel = (event: WheelEvent) => {
      if (scrollContainerRef.current) {
        if (event.deltaX !== 0) {
          event.preventDefault();
          scrollContainerRef.current.scrollLeft += event.deltaX;
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      scrollContainer.addEventListener('wheel', handleWheel);
      setTimeout(updateScrollArrows, 100);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const goToRecipe = (recipeId: string) => {
    track('Clicked on example workflow', {
      context: 'education_carousel',
      workflow: recipes.find((recipe) => recipe.id === recipeId)?.name,
    });
    const url = `/flow/${recipeId}`;
    window.open(url, '_blank');
  };

  const goToTutorial = (tutorialId: string) => {
    track('Clicked on video tutorial', {
      context: 'education_gallery',
      tutorial: tutorials.find((tutorial) => tutorial.id === tutorialId)?.url,
    });
    const url = tutorials.find((tutorial) => tutorial.id === tutorialId)?.url;
    window.open(url, '_blank');
  };

  const updateScrollArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
      const isScrollable = scrollWidth > clientWidth;
      const isAtStart = scrollLeft <= 1; // Tolerance for minor discrepancies
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;

      setShowLeftScrollArrow(isScrollable && !isAtStart);
      setShowRightScrollArrow(isScrollable && !isAtEnd);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 1000, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -1000, behavior: 'smooth' });
    }
  };

  const handleMouseEnter = () => {
    updateScrollArrows();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      setShowLeftScrollArrow(false);
      setShowRightScrollArrow(false);
    }
  };

  const getGalleryData = (selectedTab: EducationGalleryTabs, recipes: any[], tutorials: any[]) => {
    if (selectedTab === EducationGalleryTabs.WORKFLOWS && recipes) {
      return recipes
        .filter((recipe) => recipe.showcaseOrder !== undefined)
        .sort((a, b) => a.showcaseOrder - b.showcaseOrder);
    } else if (selectedTab === EducationGalleryTabs.TUTORIALS && tutorials) {
      return tutorials.sort((a, b) => a.order - b.order);
    }
    return [];
  };

  return (
    <Box
      sx={{ position: 'relative', width: '100%', backgroundColor: color.Black92, borderRadius: 2, py: 2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <FlexCenVer sx={{ pl: 2 }}>
        <AppToggleButtons
          value={selectedTab}
          options={[
            {
              value: EducationGalleryTabs.WORKFLOWS,
              label: t(I18N_KEYS.MAIN_DASHBOARD.EDUCATION_GALLERY.WORKFLOWS),
              'aria-label': t(I18N_KEYS.MAIN_DASHBOARD.EDUCATION_GALLERY.WORKFLOWS),
            },
            {
              value: EducationGalleryTabs.TUTORIALS,
              label: t(I18N_KEYS.MAIN_DASHBOARD.EDUCATION_GALLERY.TUTORIALS),
              'aria-label': t(I18N_KEYS.MAIN_DASHBOARD.EDUCATION_GALLERY.TUTORIALS),
            },
          ]}
          onChange={(newTab) => {
            if (newTab !== null) {
              setSelectedTab(newTab);
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = 0;
              }
            }
          }}
        />
      </FlexCenVer>
      <Box sx={{ position: 'relative' }}>
        <Box
          ref={scrollContainerRef}
          sx={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            mt: 2,
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 2, px: 3 }}>
            {getGalleryData(selectedTab, recipes, tutorials).map((item) => (
              <EducationGalleryCard
                key={item.id}
                cardContent={item}
                handleClick={selectedTab === EducationGalleryTabs.WORKFLOWS ? goToRecipe : goToTutorial}
                showGradient={true}
              />
            ))}
          </Box>
        </Box>
        {showLeftScrollArrow && <Arrow right={false} onClick={scrollLeft} />}
        {showRightScrollArrow && <Arrow right={true} onClick={scrollRight} />}
      </Box>
    </Box>
  );
}

export default EducationGallery;
