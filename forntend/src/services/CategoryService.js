import api from './axios';

export const fetchCategories = async () => {
  const response = await api.get('categories/');
  return response.data;
};

export const addCategory = async (category) => {
  const response = await api.post('categories/', category);
  return response.data;
};
