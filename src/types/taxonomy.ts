export interface TaxonomyItem {
  id: number;
  name: string;
  is_active: boolean;
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
}
