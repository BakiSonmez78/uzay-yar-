// i18n - Simple internationalization system
const LANG_KEY = 'astromath_lang';

const translations = {
    tr: {
        // Login
        login_title: 'Astromath',
        login_subtitle: 'Giriş yaparak maceraya başla!',
        login_google: 'Google ile Giriş Yap',
        login_guest: 'Misafir Olarak Devam Et',
        login_info: 'Google ile giriş yaparak skorlarınız kaydedilir ve liderlik tablosunda görünürsünüz.',
        login_loading: 'Giriş yapılıyor...',
        login_version: 'Versiyon: 1.0.6',
        login_popup_closed: 'Giriş penceresi kapatıldı. Lütfen tekrar deneyin.',
        login_popup_blocked: 'Popup engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.',
        login_cancelled: 'Giriş iptal edildi.',
        login_failed: 'Google girişi başarısız. Lütfen tekrar deneyin.',
        login_guest_failed: 'Misafir girişi başarısız. Lütfen tekrar deneyin.',

        // Menu
        menu_online: 'Online Oyna',
        menu_online_desc: 'Gerçek rakiplerle yarış',
        menu_friends: 'Arkadaşınla Oyna',
        menu_friends_desc: 'Özel oda kur veya katıl',
        menu_bot: 'Bilgisayara Karşı',
        menu_bot_desc: 'Yapay zeka ile antrenman yap',
        menu_mistakes: 'Yanlışlarım',
        menu_shop: 'Mağaza',
        menu_profile: 'Profilim',
        menu_privacy: 'Gizlilik Politikası',
        menu_terms: 'Kullanım Koşulları',

        // Game
        game_score: 'Skor',
        game_question: 'Soru',
        game_correct: 'Doğru!',
        game_wrong: 'Yanlış!',
        game_time: 'Süre',
        game_round: 'Tur',

        // Results
        results_win: 'TEBRİKLER!',
        results_draw: 'BERABERE!',
        results_lose: 'ÜZGÜNÜM...',
        results_win_msg: 'Harika bir iş çıkardın!',
        results_draw_msg: 'Dostluk kazandı.',
        results_lose_msg: 'Bir dahaki sefere başaracaksın!',
        results_you: 'SEN',
        results_opponent: 'Rakip',
        results_correct: 'Doğru',
        results_wrong: 'Yanlış',
        results_accuracy: 'İsabet',
        results_streak: 'En İyi Seri',
        results_avg_time: 'Ort. Süre',
        results_home: 'Ana Menüye Dön 🏠',
        results_next: 'Sıradaki Tura Geç ➡️',
        results_tournament_back: 'Turnuva Tablosuna Dön 📋',
        results_watch_ad: '🎬 Reklam İzle → +50 Coin',

        // Profile
        profile_title: 'Profilim',
        profile_stats: 'İstatistik',
        profile_badges: 'Rozetler',
        profile_total_games: 'Toplam Oyun',
        profile_wins: 'Kazanılan',
        profile_correct_ans: 'Doğru Cevap',
        profile_wrong_ans: 'Yanlış Cevap',
        profile_accuracy_rate: 'İsabet Oranı',
        profile_best_streak: 'En İyi Seri',
        profile_boss_beaten: 'Boss Yenilen',
        profile_fast_ans: 'Hızlı Cevap',

        // Shop
        shop_title: 'Mağaza',
        shop_avatars: 'Avatarlar',
        shop_themes: 'Temalar',
        shop_powerups: 'Güçler',
        shop_adfree: 'Reklamsız',
        shop_earn: '🎬 Reklam İzle → +50 Coin Kazan',
        shop_owned: 'Sahipsin',
        shop_buy_adfree: '🪙 2000 Coin ile Satın Al',
        shop_adfree_active: 'Reklamsız mod aktif!',
        shop_adfree_desc: 'Tüm reklamları kaldır, kesintisiz oyna!',
        shop_insufficient: 'Yetersiz coin!',
        shop_purchased: 'Satın alındı! 🎉',

        // Onboarding
        onboard_welcome: 'Astromath\'a Hoş Geldin! 🚀',
        onboard_step1_title: 'Oyun Modunu Seç',
        onboard_step1_desc: 'Online\'da gerçek rakiplerle, arkadaşlarınla veya bilgisayara karşı oyna!',
        onboard_step2_title: 'Soruları Çöz',
        onboard_step2_desc: 'Hızlı ol, doğru cevapla! Her doğru cevap puan kazandırır.',
        onboard_step3_title: 'Sıralamada Yüksel',
        onboard_step3_desc: 'XP kazan, rütbe atla ve liderlik tablosunda zirveye çık!',
        onboard_step4_title: 'Mağazayı Keşfet',
        onboard_step4_desc: 'Coin biriktir, premium avatarlar ve güçlendirmeler satın al!',
        onboard_next: 'İleri',
        onboard_prev: 'Geri',
        onboard_start: 'Başla! 🎮',
        onboard_skip: 'Atla',

        // Matchmaking
        match_searching: 'Rakip aranıyor...',
        match_found: 'Rakip bulundu!',

        // General
        lang_name: 'Türkçe',
    },
    en: {
        // Login
        login_title: 'Astromath',
        login_subtitle: 'Sign in to start the adventure!',
        login_google: 'Sign in with Google',
        login_guest: 'Continue as Guest',
        login_info: 'Sign in with Google to save your scores and appear on the leaderboard.',
        login_loading: 'Signing in...',
        login_version: 'Version: 1.0.6',
        login_popup_closed: 'Sign-in window was closed. Please try again.',
        login_popup_blocked: 'Popup was blocked. Please check your browser settings.',
        login_cancelled: 'Sign-in was cancelled.',
        login_failed: 'Google sign-in failed. Please try again.',
        login_guest_failed: 'Guest login failed. Please try again.',

        // Menu
        menu_online: 'Play Online',
        menu_online_desc: 'Race against real opponents',
        menu_friends: 'Play with Friends',
        menu_friends_desc: 'Create or join a private room',
        menu_bot: 'Play vs Computer',
        menu_bot_desc: 'Practice with AI opponent',
        menu_mistakes: 'My Mistakes',
        menu_shop: 'Shop',
        menu_profile: 'My Profile',
        menu_privacy: 'Privacy Policy',
        menu_terms: 'Terms of Service',

        // Game
        game_score: 'Score',
        game_question: 'Question',
        game_correct: 'Correct!',
        game_wrong: 'Wrong!',
        game_time: 'Time',
        game_round: 'Round',

        // Results
        results_win: 'CONGRATULATIONS!',
        results_draw: 'DRAW!',
        results_lose: 'SORRY...',
        results_win_msg: 'Great job!',
        results_draw_msg: 'Friendship wins.',
        results_lose_msg: 'You\'ll get them next time!',
        results_you: 'YOU',
        results_opponent: 'Opponent',
        results_correct: 'Correct',
        results_wrong: 'Wrong',
        results_accuracy: 'Accuracy',
        results_streak: 'Best Streak',
        results_avg_time: 'Avg. Time',
        results_home: 'Back to Menu 🏠',
        results_next: 'Next Round ➡️',
        results_tournament_back: 'Back to Tournament 📋',
        results_watch_ad: '🎬 Watch Ad → +50 Coins',

        // Profile
        profile_title: 'My Profile',
        profile_stats: 'Statistics',
        profile_badges: 'Badges',
        profile_total_games: 'Total Games',
        profile_wins: 'Wins',
        profile_correct_ans: 'Correct Answers',
        profile_wrong_ans: 'Wrong Answers',
        profile_accuracy_rate: 'Accuracy Rate',
        profile_best_streak: 'Best Streak',
        profile_boss_beaten: 'Boss Beaten',
        profile_fast_ans: 'Fast Answers',

        // Shop
        shop_title: 'Shop',
        shop_avatars: 'Avatars',
        shop_themes: 'Themes',
        shop_powerups: 'Powers',
        shop_adfree: 'Ad-Free',
        shop_earn: '🎬 Watch Ad → +50 Coins',
        shop_owned: 'Owned',
        shop_buy_adfree: '🪙 Buy with 2000 Coins',
        shop_adfree_active: 'Ad-free mode is active!',
        shop_adfree_desc: 'Remove all ads, play without interruptions!',
        shop_insufficient: 'Not enough coins!',
        shop_purchased: 'Purchased! 🎉',

        // Onboarding
        onboard_welcome: 'Welcome to Astromath! 🚀',
        onboard_step1_title: 'Choose Game Mode',
        onboard_step1_desc: 'Play online vs real players, with friends, or against AI!',
        onboard_step2_title: 'Solve Questions',
        onboard_step2_desc: 'Be fast, answer correctly! Every correct answer earns points.',
        onboard_step3_title: 'Climb the Rankings',
        onboard_step3_desc: 'Earn XP, rank up, and reach the top of the leaderboard!',
        onboard_step4_title: 'Explore the Shop',
        onboard_step4_desc: 'Collect coins, buy premium avatars and power-ups!',
        onboard_next: 'Next',
        onboard_prev: 'Back',
        onboard_start: 'Start! 🎮',
        onboard_skip: 'Skip',

        // Matchmaking
        match_searching: 'Searching for opponent...',
        match_found: 'Opponent found!',

        // General
        lang_name: 'English',
    }
};

// Get current language
export function getLang() {
    return localStorage.getItem(LANG_KEY) || 'tr';
}

// Set language
export function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    window.dispatchEvent(new Event('langchange'));
}

// Get translation
export function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] || translations['tr']?.[key] || key;
}

// Toggle language
export function toggleLang() {
    const current = getLang();
    setLang(current === 'tr' ? 'en' : 'tr');
}

export default { getLang, setLang, t, toggleLang };
