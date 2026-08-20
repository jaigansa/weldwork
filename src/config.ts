export const SITE = {
  title: "WeldWork",
  description: "Premium Metal Fabrication Works & Industrial Welding Solutions",
  baseURL: "https://weldwork.in/",
  languageCode: "en"
};

export const PARAMS = {
  web3forms_access_key: import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY || "",
  turnstile_sitekey: import.meta.env.PUBLIC_TURNSTILE_SITEKEY || "",
  cloudflare_beacon_token: import.meta.env.PUBLIC_CLOUDFLARE_BEACON_TOKEN || "",
  supabase_url: import.meta.env.PUBLIC_SUPABASE_URL || "",
  supabase_anon_key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "",
  home: {
    show_hero: true,
    background_image: "/images/shop-bg.jpg",
    show_shop_hours: true,
    show_action_buttons: true,
    show_call_button: true,
    show_whatsapp_button: true,
    show_location_button: true,
    show_email_button: true,
    show_markdown_content: true,
  },
  catalogue: {
    show_section_header: true,
    background_image: "/images/fabrication-1.jpg",
    show_feature_images: true,
    show_category_chips: true,
    show_rate_display: true,
    show_team_references: true,
    show_specifications_button: true,
  },
  teams: {
    show_section_header: true,
    background_image: "/images/welding-1.jpg",
    show_experience_badge: true,
    show_skills_box: true,
    show_worker_bio: true,
    show_contact_buttons: true,
    show_info_button: true,
  }
};
