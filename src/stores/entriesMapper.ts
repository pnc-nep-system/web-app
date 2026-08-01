import { BUDGET_BANDS } from '@/constants/programme'
import type { ProgrammeIdentity } from '@/types/programme'

export function mapEntry(e: any): ProgrammeIdentity {
  return {
    id: e.id,
    name: e.programme_name || '',
    startYear: e.start_year || null,
    endYear: e.end_year || null,
    isOngoing: !!e.ongoing,
    fteStaff: e.fte_staff ? parseFloat(e.fte_staff) : null,
    budgetBand: e.budget_band_id ? BUDGET_BANDS[e.budget_band_id - 1] || null : null,
    directBeneficiaries: e.direct_beneficiaries || null,
    indirectBeneficiaries: e.indirect_beneficiaries || null,
    method: e.method || '',
    verifiedDate: e.verified_date || '',
    isUnverified: !!e.is_unverified,
    provinces: Array.from(new Set((e.locations || []).map((loc: any) => {
      return loc.province?.province_name ?? loc.province_name ?? ''
    }).filter(Boolean))),
    activities: (e.activities || []).map((a: any) => {
      const code = a.activity_item?.code || a.code || (typeof a === 'string' ? a : '')
      const isPrimary = !!(a.is_primary ?? a.primary)
      return { code, is_primary: isPrimary, primary: isPrimary, activity_item: a.activity_item || { code } }
    }).filter((a: any) => a.code),
    lastUpdated: e.last_updated_at || e.updated_at || '',
    isDraft: !Number(e.is_submitted),
  }
}

export function mapDetailEntry(e: any): any {
  return {
    id: String(e.id),
    name: e.programme_name || '',
    organisationId: e.organisation_id || e.organisation?.id,
    organisationName: e.organisation_name || e.organisation?.name,
    startYear: e.start_year || null,
    endYear: e.end_year || null,
    isOngoing: !!e.ongoing,
    staffFte: e.fte_staff ? parseFloat(e.fte_staff) : null,
    budgetBand: e.budget_band_id ? BUDGET_BANDS[e.budget_band_id - 1] || null : null,
    directBeneficiaries: e.direct_beneficiaries || null,
    indirectBeneficiaries: e.indirect_beneficiaries || null,
    method: e.method || '',
    verifiedDate: e.verified_date || '',
    isUnverified: !!e.is_unverified,
    locations: (e.locations || []).filter((loc: any) => loc.province || loc.province_name).map((loc: any) => {
      const pName = loc.province?.province_name ?? loc.province_name ?? ''
      const dName = loc.district?.name ?? loc.district_name ?? ''
      const cName = loc.commune?.name ?? loc.commune_name ?? ''
      const vName = loc.village?.name ?? loc.village_name ?? ''
      const subName = vName || cName || dName
      const label = (!subName || subName === pName) ? pName : `${subName}, ${pName}`
      return { label, provinceName: pName }
    }).filter((loc: any) => loc.label),
    activities: (e.activities || []).map((a: any) => ({
      code: a.activity_item?.code || a.code || '',
      is_primary: !!(a.is_primary ?? a.primary),
      primary: !!(a.is_primary ?? a.primary),
      other_text: a.other_text || a.otherText || null,
      otherText: a.other_text || a.otherText || null,
      inclusion: a.inclusion_group ? { group: a.inclusion_group, type: a.inclusion_type } : null,
      levels: a.activity_levels?.map((l: any) => l.education_level_id ?? l) ?? [],
      source: a.source || null,
    })).filter((a: any) => a.code),
    governmentAgreements: (e.government_agreements || []).map((g: any) => ({
      counterpart: g.counterpart_agency || g.counterpart || '',
      institution: g.institution_name || g.institution || '',
      nature: g.nature || '',
      status: g.status || '',
    })),
    keywords: (e.keywords || []).map((k: any) => k.keyword ?? k),
    otherCountries: e.other_countries || e.otherCountries || '',
    lastUpdated: e.last_updated_at || e.updated_at || '',
    isDraft: !Number(e.is_submitted),
  }
}
