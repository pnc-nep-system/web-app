import api from './axios';
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
  }
};

