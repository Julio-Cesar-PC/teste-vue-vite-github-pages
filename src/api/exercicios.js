import axios from 'axios';

const api = axios.create({
  baseURL: 'https://script.google.com/macros/s/AKfycbywGgvJFPnwXUqMjWtUkGqaewTqq7LaPNyMq2EmzEN-e-MoML1crdOTinf7upsxpEhl/exec',
});

export const getExercicioAleatorio = async () => {
  try {
    const response = await api.get('/exec?actionRequest=getExercicioAleatorio&dificuldade=0');
    return response.data;
  } catch (error) {
    console.error(error);
  }
}