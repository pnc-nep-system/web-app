import api from './axios';
import { taxonomyApi } from './taxonomy.api';
import type { ProgrammeIdentity, Province, District } from '@/types/programme'

export const memberApi = {
  listProgrammeEntries(organisationId: number | string) {
    return api.get(`/organisations/${organisationId}/programme-entries`);
  },
  createProgrammeEntry(data: ProgrammeIdentity) {
    return api.post('/programme-entries', data);
  },
  updateProgrammeEntry(id: number | string, data: ProgrammeIdentity) {
    return api.put(`/programme-entries/${id}`, data);
  },
  getProgrammeEntry(id: number | string) {
    return api.get(`/programme-entries/${id}`);
  },
  getProvinces() {
    return api.get<{ data: Province[] }>('/provinces');
  },
  getDistricts(provinceId: number) {
    return api.get<{ data: District[] }>(`/provinces/${provinceId}/districts`);
  },
  getMapEntries() {
    return api.get('/map/entries');
  },
  saveGovernmentAgreements(id: number | string, agreements: any[]) {
    return api.put(`/programme-entries/${id}/government-agreements`, { agreements });
  },
  saveActivities(id: number | string, activities: any[]) {
    return api.post(`/programme-entries/${id}/activities`, { activities });
  },
  saveGeography(id: number | string, data: any) {
    return api.put(`/programme-entries/${id}/geography`, data);
  },
  getGeography(id: number | string) {
    return api.get(`/programme-entries/${id}/geography`);
  },
  getDraftProgrammeEntries(page = 1) {
    return api.get(`/programme-entries/draft?page=${page}`);
  },
  getSubmittedProgrammeEntries(page = 1) {
    return api.get(`/programme-entries/submitted?page=${page}`);
  },
  saveKeywords(id: number | string, keywords: string[]) {
    return api.put(`/programme-entries/${id}/keywords`, { keywords });
  },
  getTaxonomyCategories() {
    return taxonomyApi.list();
  }
};


