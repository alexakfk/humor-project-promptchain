export interface Profile {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean;
  is_in_study: boolean;
  is_matrix_admin: boolean;
}

export interface HumorFlavor {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  description: string | null;
  slug: string;
}

export interface HumorFlavorStep {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  humor_flavor_id: number;
  llm_temperature: number | null;
  order_by: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  humor_flavor_step_type_id: number;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  description: string | null;
}

export interface HumorFlavorStepType {
  id: number;
  created_at: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  slug: string;
  description: string;
}

export interface LlmProvider {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  name: string;
}

export interface LlmModel {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  name: string;
  llm_provider_id: number;
  provider_model_id: string;
  is_temperature_supported: boolean;
  llm_providers?: LlmProvider;
}

export interface LlmInputType {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  description: string;
  slug: string;
}

export interface LlmOutputType {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  description: string;
  slug: string;
}

export interface Caption {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  content: string | null;
  is_public: boolean;
  profile_id: string;
  image_id: string;
  humor_flavor_id: number | null;
  is_featured: boolean;
  like_count: number;
  llm_prompt_chain_id: number | null;
  images?: Image;
  humor_flavors?: HumorFlavor;
}

export interface Image {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  url: string | null;
  is_common_use: boolean;
  profile_id: string | null;
  additional_context: string | null;
  is_public: boolean;
  image_description: string | null;
}

export interface StudyImageSet {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  slug: string;
  description: string | null;
}

export interface StudyImageSetImageMapping {
  id: number;
  created_datetime_utc: string;
  modified_datetime_utc: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  study_image_set_id: number;
  image_id: string;
  images?: Image;
}

export interface HumorFlavorStepWithRelations extends HumorFlavorStep {
  humor_flavor_step_types?: HumorFlavorStepType;
  llm_models?: LlmModel;
  llm_input_types?: LlmInputType;
  llm_output_types?: LlmOutputType;
}
