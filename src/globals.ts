const PROD_URL = 'https://api.weavy.ai'; // todo: remove and just use env var
export const BASE_SERVER_URL = import.meta.env.VITE_SERVER_URL || PROD_URL;
const server_url = BASE_SERVER_URL + '/api';

export default server_url;
