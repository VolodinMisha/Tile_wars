import { Language } from './types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // App & Title
    app_title: 'TILE WARS // TACTICAL TERMINAL',
    app_subtitle: 'HEX MIL-SPEC COMMAND SYSTEM // MK-X',
    system_ready: 'SYSTEM INITIALIZED. STANDBY FOR COMMAND.',
    enter_start: 'ENTER / SPACE TO START',
    press_to_begin: 'INITIALIZE SYSTEM',
    autostart_notice: 'AUTO-DEPLOY ACTIVE',

    // Menus & Mode Selection
    menu_step_1: '01 // PROTOCOL & PARAMETERS',
    menu_step_2: '02 // OPERATIONAL MODE',
    menu_step_3: '03 // GRID THEATER SCALE',
    menu_step_4: '04 // COMBAT PACING',
    menu_step_5: '05 // ADVERSARY COGNITION',
    menu_step_6: '06 // SPECIAL DOCTRINES',

    btn_next: 'NEXT >>',
    btn_prev: '<< BACK',
    btn_continue: 'CONTINUE >>',
    btn_play: 'INITIALIZE DEPLOYMENT >>',
    btn_deploy: 'CONFIRM & EXECUTE WARGAME',
    btn_settings: 'SYSTEM SETTINGS',
    btn_restart: 'REBOOT SIMULATION',
    btn_main_menu: 'ABORT TO TERMINAL',
    btn_resume: 'RESUME TACTICAL FEED',
    btn_next_mission: 'NEXT MISSION >>',

    // Settings
    setting_audio: 'AUDIO SYNTHESIZER',
    setting_vibration: 'HAPTIC FEEDBACK',
    setting_theme: 'TERMINAL THEME',
    theme_dark: 'PHOSPHOR DARK (CRT)',
    theme_light: 'ARCHIVAL PAPER (LIGHT)',
    status_on: 'ONLINE [ENABLED]',
    status_off: 'OFFLINE [MUTED]',

    // Map Sizes
    size_s: 'SCALE S (SECTOR SQUAD // 19 NODES)',
    size_m: 'SCALE M (TACTICAL CORPS // 37 NODES)',
    size_l: 'SCALE L (THEATER BATTALION // 61 NODES)',
    size_xl: 'SCALE XL (CONTINENTAL FRONT // 91 NODES)',
    size_xxl: 'SCALE XXL (GLOBAL WARGRID // 127 NODES)',
    size_s_desc: 'Rapid skirmish with tight choke points.',
    size_m_desc: 'Standard tactical theater. Balanced pacing.',
    size_l_desc: 'Extended frontline with multi-flank warfare.',
    size_xl_desc: 'Large operations requiring supply coordination.',
    size_xxl_desc: 'Massive attrition wargrid with deep logistics.',

    // Speed
    speed_tactical: 'TACTICAL (DELIBERATE PACING)',
    speed_turbo: 'TURBO (INSTANT COGNITION)',
    speed_tactical_desc: 'Step-by-step bot resolution with visual attack arcs.',
    speed_turbo_desc: 'Near-instantaneous AI turns for fast session play.',

    // Bots
    bot_count_label: 'ADVERSARY UNITS (1 - 4 ENEMY CORES)',
    bot_difficulty_label: 'COGNITIVE THREAT TIER',
    diff_easy: 'RECRUIT (EASY)',
    diff_medium: 'OPERATOR (MEDIUM)',
    diff_hard: 'STRATEGIST (HARD)',
    diff_pro: 'PRO COGNITION (MAX THREAT)',
    diff_easy_desc: 'Random expansion, minimal aggression calculation.',
    diff_medium_desc: 'Standard frontline defense and opportunistic attacks.',
    diff_hard_desc: 'Prioritizes cluster connectivity and encirclement.',
    diff_pro_desc: 'Advanced minimax heuristics with tactical overclocking.',

    // Modes
    mode_fow: 'DOCTRINE 1: FOG OF WAR',
    mode_fow_desc: 'Distant radar nodes are unscanned until adjacent contact.',
    mode_symmetric: 'DOCTRINE 2: SYMMETRIC WARGRID',
    mode_symmetric_desc: 'Geometrically balanced map with equidistant spawns.',
    mode_alliances: 'DOCTRINE 3: EMERGENCY TRANSFER / ALLIANCE',
    mode_alliances_desc: 'Factions near collapse (<10% forces) gracefully transfer isolated nodes to allies.',
    mode_swarm: 'DOCTRINE 4: SWARM DEPLOYMENT',
    mode_swarm_desc: 'All map sectors pre-distributed randomly at start.',
    mode_default_hint: 'Select zero to four doctrines. If none selected, standard random terrain applies.',

    // In-game HUD
    hud_turn: 'CYCLE',
    hud_moves: 'MANEUVERS',
    hud_moves_label: 'MOVES REMAINING (MAX 3/CYCLE)',
    hud_reinforcements: 'REINFORCEMENT POINTS',
    hud_reinforce_cta: 'TAP OWNED NODE TO ASSIGN (+1)',
    hud_moves_exhausted: '0/3 MOVES LEFT. ASSIGN FORCES OR END TURN.',
    hud_player: 'COMMANDER',
    hud_bot: 'AI BOT',
    hud_active_turn: 'ACTIVE PHASE',
    hud_your_turn: 'YOUR COMMAND TURN',
    hud_enemy_turn: 'PROCESSING ADVERSARY TURN...',
    hud_nodes: 'CONTROLLED NODES',
    hud_forces: 'TOTAL UNITS',
    hud_end_turn: 'END TURN // PROCESS ADVERSARY',
    hud_overclock: 'OVERCLOCK (+ATK BONUS / BURNOUT RISK)',
    hud_overclock_active: 'OVERCLOCK ACTIVE: +35% ATK',
    hud_overclock_inactive: 'OVERCLOCK: DISENGAGED',
    hud_cancel_sel: 'DESELECT NODE',
    hud_pan_zoom_hint: 'DRAG TO PAN • PINCH / SCROLL TO ZOOM • TAP TO REINFORCE OR TARGET',
    hud_reset_camera: 'RESET CAM',

    // Game Actions & Logs
    log_select_node: 'Node selected. Tap an adjacent node or directional arrow to execute order.',
    log_storm_blocked: 'TRANSMISSION BLOCKED: Severe electromagnetic storm disrupts all movement.',
    log_attack_win: 'SUCCESS: Node captured! Defender neutralized.',
    log_attack_loss: 'REPULSED: Assault forces repelled. Heavy casualties sustained.',
    log_overclock_burnout: 'CRITICAL SYSTEM BURNOUT: Overclock attack failed! Sector unit generation disabled for 2 turns.',
    log_emergency_transfer: 'EMERGENCY PROTOCOL: Faction near defeat yielded isolated sectors to allies.',
    log_storm_spawn: 'WARNING: Electromagnetic storm emerged at grid sector.',
    log_storm_cleared: 'RADAR CLEAR: Electromagnetic interference dissipated.',
    log_growth: 'Reinforcements generated based on controlled sectors.',
    log_reinforce_cell: 'Reinforced sector with +1 unit from tactical pool.',
    log_no_moves: 'MANEUVER LIMIT REACHED: Maximum 3 troop actions per cycle. End turn to proceed.',
    log_eliminated: 'CRITICAL: Faction eliminated from tactical theater.',

    // End Game Debrief
    debrief_victory: 'STRATEGIC VICTORY // THEATER SECURED',
    debrief_defeat: 'OPERATIONAL DEFEAT // COMMAND COMPROMISED',
    debrief_turn_count: 'TOTAL CYCLES ELAPSED',
    debrief_nodes_controlled: 'FINAL TERRITORY CONTROLLED',
    debrief_forces_standing: 'FINAL FORCES MOBILIZED',
    btn_play_again: 'RE-ENGAGE (NEW THEATER)',
    btn_return_menu: 'SYSTEM MENU',

    // Players
    player_human: 'COMMAND (YOU)',
    player_bot_1: 'AEGIS-01 (AMBER)',
    player_bot_2: 'CYPHER-02 (CRIMSON)',
    player_bot_3: 'VORTEX-03 (VIOLET)',
    player_bot_4: 'NEXUS-04 (AZURE)',
    player_neutral: 'NEUTRAL GRID',
  },

  ua: {
    // App & Title
    app_title: 'TILE WARS // ТАКТИЧНИЙ ТЕРМІНАЛ',
    app_subtitle: 'ВІЙСЬКОВА ГЕКС-КОМАНДНА СИСТЕМА // MK-X',
    system_ready: 'СИСТЕМУ ІНІЦІАЛІЗОВАНО. ОЧІКУВАННЯ НАКАЗУ.',
    enter_start: 'ENTER / ПРОБІЛ ДЛЯ СТАРТУ',
    press_to_begin: 'ІНІЦІАЛІЗУВАТИ СИСТЕМУ',
    autostart_notice: 'АВТО-РОЗГОРТАННЯ АКТИВНЕ',

    // Game Mode Branch
    mode_branch_title: '00 // РЕЖИМ БОЙОВИХ ДІЙ',
    mode_campaign_title: 'МІНІ-КАМПАНІЯ // 20 РІВНІВ',
    mode_campaign_desc: 'Послідовні військові операції з поступовим зростанням складності та новими правилами.',
    mode_custom_title: 'КАСТОМНА ГРА',
    mode_custom_desc: 'Повний вибір розміру карти (S до XXL), кількості ботів, рівня інтелекту та доктрин.',
    campaign_level_select: 'ТАКТИЧНИЙ ДОСЬЄ // ВИБІР МІСІЇ',
    campaign_locked: 'ЗАБЛОКОВАНО // ПРОЙДІТЬ ПОПЕРЕДНЮ МІСІЮ',
    campaign_launch: 'ПОЧАТИ МІСІЮ',
    campaign_level_prefix: 'МІСІЯ',
    campaign_progress: 'ДОСТУПНО МІСІЙ',

    // Menus & Mode Selection
    menu_step_1: '01 // ПРОТОКОЛ ТА ПАРАМЕТРИ',
    menu_step_2: '02 // РЕЖИМ ОПЕРАЦІЇ',
    menu_step_3: '03 // МАСШТАБ СІТКИ ТЕАТРУ',
    menu_step_4: '04 // ТЕМП БОЙОВИХ ДІЙ',
    menu_step_5: '05 // КОГНІТИВНИЙ РІВЕНЬ ВОРОГА',
    menu_step_6: '06 // СПЕЦІАЛЬНІ ДОКТРИНИ',

    btn_next: 'ДАЛІ >>',
    btn_prev: '<< НАЗАД',
    btn_continue: 'ПРОДОВЖИТИ >>',
    btn_play: 'ПОЧАТИ РОЗГОРТАННЯ >>',
    btn_deploy: 'ПІДТВЕРДИТИ ТА ПОЧАТИ ГРУ',
    btn_settings: 'ПАРАМЕТРИ СИСТЕМИ',
    btn_restart: 'ПЕРЕЗАПУСК СИМУЛЯЦІЇ',
    btn_main_menu: 'ВИХІД У ТЕРМІНАЛ',
    btn_resume: 'ПОВЕРНУТИСЬ ДО ТАКТИКИ',
    btn_next_mission: 'НАСТУПНА МІСІЯ >>',

    // Settings
    setting_audio: 'АУДІО-СИНТЕЗАТОР',
    setting_vibration: 'ТАКТИЛЬНИЙ ВІДГУК (ВІБРАЦІЯ)',
    setting_theme: 'ТЕМА ТЕРМІНАЛУ',
    theme_dark: 'ФОСФОРНА ТЕМНА (CRT)',
    theme_light: 'АРХІВНИЙ ПАПІР (СВІТЛА)',
    status_on: 'ОНЛАЙН [УВІМКНЕНО]',
    status_off: 'ОФЛАЙН [БЕЗ ЗВУКУ]',

    // Map Sizes
    size_s: 'МАСШТАБ S (ТАКТИЧНИЙ ЗАГІН // 19 ВУЗЛІВ)',
    size_m: 'МАСШТАБ M (АРМІЙСЬКИЙ КОРПУС // 37 ВУЗЛІВ)',
    size_l: 'МАСШТАБ L (ТЕАТР ДІЙ БАТАЛЬЙОНУ // 61 ВУЗОЛ)',
    size_xl: 'МАСШТАБ XL (ФРОНТОВА ОПЕРАЦІЯ // 91 ВУЗОЛ)',
    size_xxl: 'МАСШТАБ XXL (ГЛОБАЛЬНА СІТКА // 127 ВУЗЛІВ)',
    size_s_desc: 'Швидка сутичка з вузькими проходами.',
    size_m_desc: 'Стандартний тактичний театр. Збалансований темп.',
    size_l_desc: 'Розширена лінія фронту з маневрами на флангах.',
    size_xl_desc: 'Масштабна операція з координацією постачання.',
    size_xxl_desc: 'Масивна війна на виснаження з глибокою логістикою.',

    // Speed
    speed_tactical: 'ТАКТИЧНИЙ (РОЗМІРЕНИЙ ТЕМП)',
    speed_turbo: 'ТУРБО (МИТТЄВИЙ РОЗРАХУНОК)',
    speed_tactical_desc: 'Покроковий візуальний хід ботів із траєкторіями атак.',
    speed_turbo_desc: 'Майже миттєві ходи ШІ для швидкої сесії.',

    // Bots
    bot_count_label: 'СИЛИ СУПРОТИВНИКА (1 - 4 БОТ-ЯДРА)',
    bot_difficulty_label: 'РІВЕНЬ ЗАГРОЗИ ШІ',
    diff_easy: 'НОВОБРАНЕЦЬ (ЛЕГКИЙ)',
    diff_medium: 'ОПЕРАТОР (СЕРЕДНІЙ)',
    diff_hard: 'СТРАТЕГ (ВАЖКИЙ)',
    diff_pro: 'ПРО-КОГНІТИВНИЙ (ЕКСТРЕМАЛЬНИЙ)',
    diff_easy_desc: 'Випадкова експансія, мінімум тактичних розрахунків.',
    diff_medium_desc: 'Стандартний захист фронту та атаки слабких точок.',
    diff_hard_desc: 'Пріоритет зв’язності кластерів і оточення ворога.',
    diff_pro_desc: 'Мінімакс-евристика з тактичним розгоном системи (Overclock).',

    // Modes
    mode_fow: 'ДОКТРИНА 1: ТУМАН ВІЙНИ',
    mode_fow_desc: 'Віддалені сектори приховані до безпосереднього контакту.',
    mode_symmetric: 'ДОКТРИНА 2: СИМЕТРИЧНА СІТКА',
    mode_symmetric_desc: 'Геометрично збалансована карта з рівними відстанями старту.',
    mode_alliances: 'ДОКТРИНА 3: АВАРІЙНА ПЕРЕДАЧА / АЛЬЯНС',
    mode_alliances_desc: 'Фракції на межі поразки (<10% сил) передають ізольовані вузли союзникам.',
    mode_swarm: 'ДОКТРИНА 4: СТАРТ-РІЙ (SWARM)',
    mode_swarm_desc: 'Усі сектори карти випадково розподілені між гравцями на старті.',
    mode_default_hint: 'Оберіть від 0 до 4 доктрин. За замовчуванням діє стандартна випадкова генерація.',

    // In-game HUD
    hud_turn: 'ЦИКЛ',
    hud_moves: 'МАНЕВРИ',
    hud_moves_label: 'МАНЕВРІВ ЗАЛИШИЛОСЯ (МАКС 3/ЦИКЛ)',
    hud_reinforcements: 'ОЧКИ ПІДКРІПЛЕНЬ',
    hud_reinforce_cta: 'ТОРКНІТЬСЯ ВЛАСНОГО ВУЗЛА ДЛЯ ПІДСИЛЕННЯ (+1)',
    hud_moves_exhausted: '0/3 МАНЕВРІВ. РОЗПОДІЛІТЬ СИЛИ АБО ЗАВЕРШІТЬ ХІД.',
    hud_player: 'КОМАНДИР',
    hud_bot: 'ШІ БОТ',
    hud_active_turn: 'АКТИВНА ФАЗА',
    hud_your_turn: 'ВАШ ХІД НАКАЗУ',
    hud_enemy_turn: 'ОБЧИСЛЕННЯ ХОДУ ВОРОГА...',
    hud_nodes: 'ПІДКОНТРОЛЬНІ ВУЗЛИ',
    hud_forces: 'ЗАГАЛЬНІ СИЛИ',
    hud_end_turn: 'ЗАВЕРШИТИ ХІД // ПЕРЕДАТИ ІНІЦІАТИВУ',
    hud_overclock: 'РОЗГІН (+АТК БОНУС / РИЗИК ВИГОРАННЯ)',
    hud_overclock_active: 'РОЗГІН АКТИВНИЙ: +35% АТАКУ',
    hud_overclock_inactive: 'РОЗГІН: ВИМКНЕНО',
    hud_cancel_sel: 'СКАСУВАТИ ВИБІР',
    hud_pan_zoom_hint: 'ПЕРЕТЯГУЙТЕ ДЛЯ ПАНУВАННЯ • ЗУМ ЖЕСТОМ ЧИ КОЛІЩАТКОМ • ПІДСИЛЮЙТЕ АБО АТАКУЙТЕ',
    hud_reset_camera: 'ЦЕНТР',

    // Game Actions & Logs
    log_select_node: 'Вузол обрано. Натисніть на сусідній сектор чи стрілку для наказу.',
    log_storm_blocked: 'ПЕРЕДАЧА ЗАБЛОКОВАНА: Електромагнітна буря блокує будь-який рух.',
    log_attack_win: 'УСПІХ: Вузол захоплено! Ворожий гарнізон нейтралізовано.',
    log_attack_loss: 'ВІДБИТО: Штурм зупинено. Зазнано важких втрат.',
    log_overclock_burnout: 'КРИТИЧНЕ ВИГОРАННЯ СИСТЕМИ: Атака з розгоном провалилася! Генерація підкріплень заблокована на 2 цикли.',
    log_emergency_transfer: 'АВАРІЙНИЙ ПРОТОКОЛ: Слабшаюча фракція передала ізольовані позиції союзникам.',
    log_storm_spawn: 'УВАГА: В секторі утворилася зона електромагнітної бурі.',
    log_storm_cleared: 'РАДАР ЧИСТИЙ: Електромагнітні завади розсіялися.',
    log_growth: 'Отримано очки підкріплень за підконтрольні сектори.',
    log_reinforce_cell: 'Посилено сектор +1 одиницею з тактичного резерву.',
    log_no_moves: 'ВИЧЕРПАНО ЛІМІТ МАНЕВРІВ: Максимум 3 пересування на цикл. Завершіть хід.',
    log_eliminated: 'КРИТИЧНО: Фракцію повністю вибито з театру дій.',

    // End Game Debrief
    debrief_victory: 'СТРАТЕГІЧНА ПЕРЕМОГА // ТЕАТР ЗАЧИЩЕНО',
    debrief_defeat: 'ОПЕРАТИВНА ПОРАЗКА // ШТАБ ЗНИЩЕНО',
    debrief_turn_count: 'ТРИВАЛІСТЬ ОПЕРАЦІЇ (ЦИКЛІВ)',
    debrief_nodes_controlled: 'ПІДСУМКОВА ЧАСТКА ТЕРИТОРІЇ',
    debrief_forces_standing: 'ЗАЛИШОК БОЙОВИХ СИЛ',
    btn_play_again: 'НОВИЙ БІЙ (НОВИЙ ТЕАТР)',
    btn_return_menu: 'ГОЛОВНЕ МЕНЮ',

    // Players
    player_human: 'КОМАНДУВАННЯ (ВИ)',
    player_bot_1: 'AEGIS-01 (БУРШТИН)',
    player_bot_2: 'CYPHER-02 (БАГРЯНИЙ)',
    player_bot_3: 'VORTEX-03 (ФІОЛЕТОВИЙ)',
    player_bot_4: 'NEXUS-04 (БЛАКИТНИЙ)',
    player_neutral: 'НЕЙТРАЛЬНИЙ СЕКТОР',
  },
};

export function t(lang: Language, key: string, fallback?: string): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || fallback || key;
}
