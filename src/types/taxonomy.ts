export interface TaxonomyItem {
  id: number;
  name: string;
  is_active: boolean;
}

export interface ActivityInclusion {
  hasInclusion: boolean;
  group?: string;
  type?: 'A' | 'B';
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
