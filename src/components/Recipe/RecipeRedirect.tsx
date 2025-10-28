import { useParams, useLocation, Navigate } from 'react-router-dom';

export const RecipeRedirect = () => {
  const { recipeId } = useParams();
  const location = useLocation();

  const safeSearch = encodeURI(location.search);
  const to = `/flow/${recipeId}${safeSearch}`;

  return <Navigate to={to} replace />;
};
