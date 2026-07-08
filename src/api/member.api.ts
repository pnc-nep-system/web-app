import api from './axios';

export const memberApi = {
  createProgrammeEntry(data: any) {
    return api.post('/programme-entries', data);
  },
  updateProgrammeEntry(id: number | string, data: any) {
    return api.put(`/programme-entries/${id}`, data);
  },
  getProgrammeEntry(id: number | string) {
    return api.get(`/programme-entries/${id}`);
  }
};
