import api from './axios';
import { taxonomyApi } from './taxonomy.api';
import type { ProgrammeIdentity, Province, District, Commune, Village } from '@/types/programme'

export const memberApi = {
  listProgrammeEntries(organisationId: number | string) {
    return api.get(`/organisations/${organisationId}/programme-entries`);
  },
  createProgrammeEntry(data: ProgrammeIdentity, organisationId?: number | string) {
    return api.post('/programme-entries', { ...data, ...(organisationId ? { organisation_id: organisationId } : {}) });
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
  getCommunes(districtId: number) {
    return api.get<{ data: Commune[] }>(`/districts/${districtId}/communes`);
  },
  getVillages(communeId: number) {
    return api.get<{ data: Village[] }>(`/communes/${communeId}/villages`);
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
  getActivities(id: number | string) {
    return api.get(`/programme-entries/${id}/activities`);
  },
  saveGeography(id: number | string, data: any) {
    return api.put(`/programme-entries/${id}/geography`, data);
  },
  getGeography(id: number | string) {
    return api.get(`/programme-entries/${id}/geography`);
  },
  getAllProgrammeEntries(page = 1) {
    return api.get(`/programme-entries?page=${page}`);
  },
  getAdminAllProgrammeEntries(page = 1, organisationId?: number | null) {
    const params: Record<string, any> = { page }
    if (organisationId) params.organisation_id = organisationId
    return api.get('/programme-entries', { params })
  },
  getDraftProgrammeEntries(page = 1) {
    return api.get(`/programme-entries/draft?page=${page}`);
  },
  getSubmittedProgrammeEntries(page = 1, perPage?: number) {
    const params: Record<string, any> = { page }
    if (perPage) params.per_page = perPage
    return api.get('/programme-entries/submitted', { params })
  },
  saveKeywords(id: number | string, keywords: string[]) {
    return api.put(`/programme-entries/${id}/keywords`, { keywords });
  },
  getTaxonomyCategories() {
    return taxonomyApi.list();
  },
  getMyOrganisation() {
    return api.get('/organisations/me');
  },
  updateMyOrganisation(payload: { contact_name?: string; email?: string }) {
    return api.patch('/organisations/me', payload);
  },
  getDraftProgrammeEntry(id: number | string) {
    return api.get(`/programme-entries/${id}`);
  },
  markVerified(id: number | string) {
    return api.patch(`/programme-entries/${id}/verify`);
  },
  listOrganisations() {
    return api.get('/organisations');
  },
  listAllOrganisations() {
    return api.get('/organisations', { params: { per_page: 200 } });
  },
};

