export interface TaxonomyItem {
  id: number;
  name: string;
  is_active: boolean;
}

export type InclusionGroup =
  | 'Disability'
  | 'Gender'
  | 'LGBTIQ+'
  | 'Ethnicity/language'
  | 'Displacement'
  | 'Migrant families'
  | 'Statelessness'
  | 'Other';

export interface ActivityInclusionDimension {
  group: InclusionGroup;
  type?: 'A' | 'B';
  otherText?: string;
}

export interface ActivityInclusion {
  hasInclusion: boolean;
  dimensions: ActivityInclusionDimension[];
}

export interface SelectedTaxonomyItem extends TaxonomyItem {
  inclusion?: ActivityInclusion;
}

export interface SubCategory {
  id: number;
  name: string;
  items: TaxonomyItem[];
}

export interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export interface SelectedActivity extends TaxonomyItem {
  educationLevelIds: number[];
  inclusion?: ActivityInclusion;
}
