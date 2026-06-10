// lib/strings.ts
// Strings_File for CarinderAI. Implements Requirements 13 and 21.
// No third-party i18n library — that is an explicit non-goal (Req 19.4).
//
// Both `en` and `tl` keysets MUST share the exact same shape so that
// `keyof typeof STRINGS['en']` is a valid `StringKey` for either branch
// and so a missing-key fallback in `useT` is well-typed.

export type Lang = 'en' | 'tl';

export const STRINGS = {
  en: {
    // --- Microcopy (Req 21) ---
    order_success_toast: 'Recorded!',
    entry_success_toast: 'Done!',    empty_cart: 'Your basket is empty. Add something!',
    empty_journal: 'No records yet. Scan or log one!',
    greeting_morning: 'Good morning!',
    greeting_afternoon: 'Good afternoon!',
    greeting_evening: 'Good evening!',
    cta_checkout: 'Check out',
    cta_scan: 'Scan list',
    cta_match: 'Match to Market',
    cta_log_expense: 'Log as expense',

    // --- Tab labels (Bottom_Nav, Req 1.3) ---
    tab_home: 'Home',
    tab_market: 'Market',
    tab_scan: 'Scan',
    tab_finance: 'Finance',
    tab_more: 'More',

    // --- Page headings ---
    heading_market: 'Market',
    heading_cart: 'Your basket',
    heading_finance: 'Finance',
    heading_finance_new: 'New entry',
    heading_scan: 'Scan',
    heading_dashboard: 'Home',
    heading_customers: 'Customer Browse',
    heading_insights: 'Insights',
    heading_tray_tally: 'Tray Tally',
    heading_settings: 'Settings',

    // --- Subtitles ---
    subtitle_dashboard: "How's your day?",
    subtitle_market: "Order supplies — let's go!",
    subtitle_cart: 'Review and check out.',
    subtitle_finance: 'Money in, money out.',
    subtitle_finance_new: 'Log a sale or expense.',
    subtitle_scan: 'Snap the list.',
    subtitle_customers: 'See nearby carinderias.',
    subtitle_insights: 'For your day',
    subtitle_tray_tally: 'Tally in a snap!',
    subtitle_settings: 'Preferences',

    // --- /finance/new form labels ---
    form_label_date: 'Date',
    form_label_type: 'Type',
    form_label_category: 'Category',
    form_label_amount: 'Amount',
    form_label_amount_php: 'Amount (₱)',
    form_label_note: 'Note',
    form_btn_save: 'Save',
    placeholder_category: 'e.g. Sales, Palengke, LPG',
    placeholder_note_optional: 'Optional',
    entry_type_revenue: 'Revenue',
    entry_type_expense: 'Expense',

    // --- Common ---
    loading: 'Loading...',
    retake: 'Retake',
    cancel: 'Cancel',
    coming_soon_delivery: 'Coming soon: delivery',
    pill_beta: 'Beta',
    back_link: '← Back',

    // --- Home (Dashboard_Tab) ---
    cta_order: 'Place an order',
    cta_log_sale: 'Log a sale',

    // --- KPI labels (Home + Finance) ---
    kpi_sales_today: 'Sales today',
    kpi_expenses_today: 'Expenses today',
    kpi_net_today: 'Net today',
    kpi_top_product: 'Top product',
    top_product_placeholder: 'None yet',

    // --- Finance ---
    cta_new_entry: '+ New entry',
    journal_section_heading: 'Journal',
    empty_journal_title: 'No records yet',

    // --- Cart ---
    cart_total_label: 'Total',
    empty_cart_title: 'Empty basket',
    unmatched_group_title: 'Unmatched',
    unmatched_group_body: 'Not found in Market — edit manually.',

    // --- Market ---
    category_all: 'All',
    supplier_all: 'All suppliers',
    empty_market_filter_title: 'Nothing matches',
    empty_market_filter_body: 'Try a different category or supplier.',
    cta_add_to_cart: 'Add to cart',

    // --- Scan ---
    scan_btn_capture: 'Take a photo',
    scan_btn_upload: 'Upload a photo',
    scan_mode_upload: 'Upload photo',
    scan_mode_camera: 'Use camera',
    scan_upload_label: 'Tap to upload photo',
    scan_upload_hint: 'JPG or PNG · max 5 MB',
    scan_items_detected: 'items detected',
    scan_add_row: '+ Add row',
    scan_add_note: '+ Add note',
    empty_scan_title: 'Nothing scanned',
    empty_scan_body: 'Try retaking the photo.',
    log_dialog_subtitle: 'Enter the total amount.',
    cta_dismiss: 'Not now',

    // --- EditableItemList ---
    field_name: 'Name',
    field_quantity: 'Quantity',
    field_unit: 'Unit',
    item_label: 'Item',
    item_remove_aria: 'Remove item',

    // --- Customers ---
    menu_heading: 'Menu',
    empty_menu_title: 'No menu yet',
    empty_menu_body: 'No dishes listed for this carinderia yet.',

    // --- Insights ---
    recommended_menu_today_label: 'Recommended menu today',

    // --- Error toasts ---
    error_checkout: 'Checkout had a problem.',
    error_save: 'Could not save. Please try again.',
    error_scan: 'Scan had a problem.',

    // --- Tray Tally ---
    heading_tray_tally_subtitle: 'Camera POS',
    tray_phase_analyzing: 'Analyzing tray...',
    tray_known_menu: 'Known menu',
    tray_total: 'Total',
    tray_record_sale: 'Record sale',
    tray_receipt_heading: 'Paid — Receipt',
    tray_new_sale: 'New sale',
    tray_view_finance: 'View in Finance',
    tray_add_dish: 'Add dish',
    tray_empty_title: 'No dishes recognized',
    tray_empty_body: 'Try retaking or add manually.',
    tray_auto_mode_label: 'Auto mode (every 10s)',
    tray_auto_active: 'Auto-capturing every 10 seconds...',
    tray_session_total: 'Session total',
    tray_session_end: 'End session',
    tray_session_summary: 'Session summary',
    tray_session_count: 'tallies',

    // --- Webcam ---
    webcam_permission_denied:
      'Camera permission denied. Please allow camera access in your browser settings.',
    webcam_no_device: 'No camera detected on this device.',
    webcam_starting: 'Starting camera...',
    webcam_capture: 'Capture',
    webcam_fallback_upload: 'Or upload a photo',

    // --- Market: Nearby Merchants ---
    market_tab_suppliers: 'Suppliers',
    market_tab_nearby: 'Nearby',
    market_nearby_subtitle: 'Walk-in or last-minute vendors',
    market_sort_distance: 'Sort: nearest',
    market_sort_price: 'Sort: cheapest',
    merchant_walking_time: 'min walk',
    merchant_accepts_orders: 'Accepts orders',
    merchant_walk_in_only: 'Walk-in only',
    merchant_available: 'Available',
    merchant_reserve: 'Reserve item',
    merchant_walk_to: 'Get directions',
    merchant_reserve_toast: 'Reserved — owner will contact you',
    merchant_directions_toast: 'Opening directions...',
    price_level_low: 'Cheap',
    price_level_mid: 'Mid',
    price_level_high: 'Pricier',

    // --- Customers: Discovery ---
    discovery_search_placeholder: 'What are you craving?',
    discovery_featured: 'Featured today',
    discovery_featured_subtitle: 'Top-rated dishes near you',
    discovery_search_results: 'Search results',
    discovery_search_empty: 'No results',
    discovery_search_empty_body: 'Try a different food or carinderia name.',
    discovery_search_carinderia_match: 'Carinderia',
    discovery_search_dish_match: 'Dish',
    discovery_all_carinderias: 'All carinderias',
    discovery_results_count: 'result',
    discovery_view_at: 'at',

    // --- Journal row actions ---
    journal_edit: 'Edit',
    journal_delete: 'Delete',
    journal_edit_title: 'Edit entry',
    journal_delete_confirm_title: 'Delete this entry?',
    journal_delete_confirm_body: 'This cannot be undone.',
    journal_delete_confirm_cta: 'Delete',
    journal_cancel: 'Cancel',
    journal_save: 'Save changes',
    journal_auto_generated_lock: 'Auto-generated from an order. Cannot edit.',
    journal_updated_toast: 'Entry updated',
    journal_deleted_toast: 'Entry deleted',

    // --- Counter Session ---
    counter_mode_label: 'Counter',
    counter_start: 'Start counter session',
    counter_end: 'End session',
    counter_refill: '+ Refill',
    counter_refill_picker_title: 'Reset baseline for which dish?',
    counter_active_indicator: 'Session active',
    counter_baseline_set: 'Baseline set',
    counter_sale_detected: 'Sold',
    counter_refill_detected: 'Refill detected',
    counter_refill_done: 'Baseline reset for',
    counter_session_summary: 'Session summary',
    counter_session_duration: 'Duration',
    counter_session_frames: 'Frames analyzed',
    counter_record_sales: 'Record sales',
    counter_discard: 'Discard',
    counter_live_counts: 'On counter now',
    counter_recorded_so_far: 'Recorded sales',
    counter_no_dishes_warning: 'No dishes detected — check camera angle',
    counter_end_first: 'End the active session first.',
  },
  tl: {
    // --- Microcopy (Req 21 — VERBATIM, do not change) ---
    order_success_toast: 'Naitala na!',
    entry_success_toast: 'Tapos na!',
    empty_cart: 'Wala pang laman ang basket mo. Mag-add ka na!',
    empty_journal: 'Wala pang record. Mag-scan o mag-log ka na!',
    greeting_morning: 'Magandang umaga!',
    greeting_afternoon: 'Magandang hapon!',
    greeting_evening: 'Magandang gabi!',
    cta_checkout: 'Bayaran na',
    cta_scan: 'I-scan ang listahan',
    cta_match: 'I-match sa Market',
    cta_log_expense: 'I-log bilang gastos',

    // --- Tab labels ---
    tab_home: 'Home',
    tab_market: 'Market',
    tab_scan: 'Scan',
    tab_finance: 'Pinansya',
    tab_more: 'Iba pa',

    // --- Page headings ---
    heading_market: 'Market',
    heading_cart: 'Basket mo',
    heading_finance: 'Pinansya',
    heading_finance_new: 'Bagong record',
    heading_scan: 'Scan',
    heading_dashboard: 'Home',
    heading_customers: 'Customer Browse',
    heading_insights: 'Insights',
    heading_tray_tally: 'Tray Tally',
    heading_settings: 'Settings',

    // --- Subtitles ---
    subtitle_dashboard: 'Kamusta ang araw mo?',
    subtitle_market: 'Mag-order na!',
    subtitle_cart: 'I-review at i-checkout.',
    subtitle_finance: 'Pera at gastos.',
    subtitle_finance_new: 'Mag-log ng kita o gastos.',
    subtitle_scan: 'I-snap ang listahan.',
    subtitle_customers: 'Tingnan ang malapit na carinderia.',
    subtitle_insights: 'Para sa araw mo',
    subtitle_tray_tally: 'Ang bilis ng tally!',
    subtitle_settings: 'Mga preference',

    // --- /finance/new form labels ---
    form_label_date: 'Petsa',
    form_label_type: 'Uri',
    form_label_category: 'Kategorya',
    form_label_amount: 'Halaga',
    form_label_amount_php: 'Halaga (₱)',
    form_label_note: 'Note',
    form_btn_save: 'I-save',
    placeholder_category: 'hal. Sales, Palengke, LPG',
    placeholder_note_optional: 'Opsyonal',
    entry_type_revenue: 'Kita',
    entry_type_expense: 'Gastos',

    // --- Common ---
    loading: 'Sandali lang...',
    retake: 'I-retake',
    cancel: 'Kanselahin',
    coming_soon_delivery: 'Malapit na: delivery',
    pill_beta: 'Beta',
    back_link: '← Bumalik',

    // --- Home (Dashboard_Tab) ---
    cta_order: 'Mag-order na',
    cta_log_sale: 'I-log ang benta',

    // --- KPI labels (Home + Finance) ---
    kpi_sales_today: 'Benta ngayon',
    kpi_expenses_today: 'Gastos ngayon',
    kpi_net_today: 'Net ngayon',
    kpi_top_product: 'Top product',
    top_product_placeholder: 'Wala pa',

    // --- Finance ---
    cta_new_entry: '+ Bagong record',
    journal_section_heading: 'Journal',
    empty_journal_title: 'Wala pang record',

    // --- Cart ---
    cart_total_label: 'Total',
    empty_cart_title: 'Wala pang laman',
    unmatched_group_title: 'Hindi natugma',
    unmatched_group_body: 'Hindi nakitaan sa Market — i-edit nang manu-mano.',

    // --- Market ---
    category_all: 'Lahat',
    supplier_all: 'Lahat ng suplayer',
    empty_market_filter_title: 'Wala pang nakita',
    empty_market_filter_body: 'Subukan mong palitan ang category o supplier.',
    cta_add_to_cart: 'I-dagdag sa cart',

    // --- Scan ---
    scan_btn_capture: 'Kunan ng larawan',
    scan_btn_upload: 'Mag-upload ng larawan',
    scan_mode_upload: 'I-upload',
    scan_mode_camera: 'Camera',
    scan_upload_label: 'I-tap para mag-upload ng larawan',
    scan_upload_hint: 'JPG o PNG · max 5 MB',
    scan_items_detected: 'na-detect na items',
    scan_add_row: '+ Magdagdag',
    scan_add_note: '+ Lagyan ng note',
    empty_scan_title: 'Wala pang nabasa',
    empty_scan_body: 'Subukan mong i-retake ang larawan.',
    log_dialog_subtitle: 'Ilagay ang kabuuang halaga.',
    cta_dismiss: 'Hindi muna',

    // --- EditableItemList ---
    field_name: 'Pangalan',
    field_quantity: 'Dami',
    field_unit: 'Unit',
    item_label: 'Item',
    item_remove_aria: 'Tanggalin ang item',

    // --- Customers ---
    menu_heading: 'Menu',
    empty_menu_title: 'Wala pang menu',
    empty_menu_body: 'Wala pang nakatalang putahe para sa karinderyang ito.',

    // --- Insights ---
    recommended_menu_today_label: 'Inirerekomendang menu ngayon',

    // --- Error toasts ---
    error_checkout: 'May problema sa checkout.',
    error_save: 'May problema sa pag-save.',
    error_scan: 'May problema sa scan.',

    // --- Tray Tally ---
    heading_tray_tally_subtitle: 'Camera POS',
    tray_phase_analyzing: 'Tinitingnan ang tray...',
    tray_known_menu: 'Mga ulam sa menu',
    tray_total: 'Kabuuan',
    tray_record_sale: 'I-record ang sale',
    tray_receipt_heading: 'Bayad na — Receipt',
    tray_new_sale: 'Bagong order',
    tray_view_finance: 'Tingnan sa Finance',
    tray_add_dish: 'Magdagdag ng ulam',
    tray_empty_title: 'Walang nakitang ulam',
    tray_empty_body: 'Subukan mong i-retake o magdagdag manually.',
    tray_auto_mode_label: 'Auto mode (bawat 10s)',
    tray_auto_active: 'Awtomatikong kumukuha bawat 10 segundo...',
    tray_session_total: 'Kabuuan ng session',
    tray_session_end: 'Tapusin ang session',
    tray_session_summary: 'Buod ng session',
    tray_session_count: 'mga tally',

    // --- Webcam ---
    webcam_permission_denied:
      'Tinanggihan ang access sa camera. Pakipayagan ito sa settings ng browser.',
    webcam_no_device: 'Walang nakitang camera sa device na ito.',
    webcam_starting: 'Bubukas ang camera...',
    webcam_capture: 'Kunan',
    webcam_fallback_upload: 'O mag-upload ng larawan',

    // --- Market: Nearby Merchants ---
    market_tab_suppliers: 'Mga Supplier',
    market_tab_nearby: 'Malapit',
    market_nearby_subtitle: 'Walk-in o last-minute vendors',
    market_sort_distance: 'Sort: pinakamalapit',
    market_sort_price: 'Sort: pinakamura',
    merchant_walking_time: 'min lakad',
    merchant_accepts_orders: 'Tumatanggap ng order',
    merchant_walk_in_only: 'Walk-in lang',
    merchant_available: 'Meron',
    merchant_reserve: 'I-reserve',
    merchant_walk_to: 'Tingnan ang direksyon',
    merchant_reserve_toast: 'Naka-reserve na — kokontakin ka ng owner',
    merchant_directions_toast: 'Bubukas ang direksyon...',
    price_level_low: 'Mura',
    price_level_mid: 'Katamtaman',
    price_level_high: 'Mahal',

    // --- Customers: Discovery ---
    discovery_search_placeholder: 'Anong gusto mo kainin?',
    discovery_featured: 'Featured ngayon',
    discovery_featured_subtitle: 'Mga pinakamataas na rating malapit sa iyo',
    discovery_search_results: 'Resulta ng search',
    discovery_search_empty: 'Walang nakitang resulta',
    discovery_search_empty_body: 'Subukan mong iba ang hanapin.',
    discovery_search_carinderia_match: 'Carinderia',
    discovery_search_dish_match: 'Ulam',
    discovery_all_carinderias: 'Lahat ng carinderia',
    discovery_results_count: 'resulta',
    discovery_view_at: 'sa',

    // --- Journal row actions ---
    journal_edit: 'I-edit',
    journal_delete: 'Burahin',
    journal_edit_title: 'I-edit ang entry',
    journal_delete_confirm_title: 'Burahin ang entry na ito?',
    journal_delete_confirm_body: 'Hindi na ito mababawi.',
    journal_delete_confirm_cta: 'Burahin',
    journal_cancel: 'Kanselahin',
    journal_save: 'I-save',
    journal_auto_generated_lock: 'Galing sa order. Hindi pwedeng i-edit.',
    journal_updated_toast: 'Na-update na',
    journal_deleted_toast: 'Naburahin na',

    // --- Counter Session ---
    counter_mode_label: 'Counter',
    counter_start: 'Simulan ang counter session',
    counter_end: 'Tapusin ang session',
    counter_refill: '+ Magdagdag',
    counter_refill_picker_title: 'Aling ulam ang nilagyan ulit?',
    counter_active_indicator: 'Session active',
    counter_baseline_set: 'Naka-baseline na',
    counter_sale_detected: 'Naibenta',
    counter_refill_detected: 'May nag-refill',
    counter_refill_done: 'Na-reset ang baseline ng',
    counter_session_summary: 'Buod ng session',
    counter_session_duration: 'Tagal',
    counter_session_frames: 'Frames na-analyze',
    counter_record_sales: 'I-record ang benta',
    counter_discard: 'Itapon',
    counter_live_counts: 'Nasa counter ngayon',
    counter_recorded_so_far: 'Naitalang benta',
    counter_no_dishes_warning: 'Walang nakitang ulam — i-check ang anggulo',
    counter_end_first: 'Tapusin muna ang aktibong session.',
  },
} as const;

export type StringKey = keyof typeof STRINGS['en'];
