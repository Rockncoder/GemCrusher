var res = {
    HelloWorld_png : "res/HelloWorld.png",
    sound_click: "res/sounds/click.mp3",
    sound_endgame: "res/sounds/endgame.mp3",
    sound_gem0: "res/sounds/gem-0.mp3",
    sound_gem1: "res/sounds/gem-1.mp3",
    sound_gem2: "res/sounds/gem-2.mp3",
    sound_gem3: "res/sounds/gem-3.mp3",
    sound_gem4: "res/sounds/gem-4.mp3",
    sound_loop: "res/sounds/loop.mp3",
    sound_miss: "res/sounds/miss.mp3",
    sound_powerup: "res/sounds/powerup.mp3",
    sound_tap0: "res/sounds/tap-0.mp3",
    sound_tap1: "res/sounds/tap-1.mp3",
    sound_tap2: "res/sounds/tap-2.mp3",
    sound_tap3: "res/sounds/tap-3.mp3",
    sound_timer: "res/sounds/timer.mp3",
    particle_bg_stars: "res/particles/bg-stars.plist",
    particle_falling_gem: "res/particles/falling-gem.plist",
    particle_power_play: "res/particles/power-play.plist",
    particle_taken_gem: "res/particles/taken-gem.plist",
    particle_taken_horizontal: "res/particles/taken-hrow.plist",
    particle_taken_vertical: "res/particles/taken-vrow.plist",
    particle_taken_gem_pic: "res/particles/taken-gem.png",
    font_score: "res/fonts/scorefont.fnt",
    gamescene_background_png: "res/gamescene/background.png",
    gamescene_btn_pause_png: "res/gamescene/btn-pause.png",
    gamescene_btn_pause_down_png: "res/gamescene/btn-pause-down.png",
    gamescene_go_png: "res/gamescene/go.png",
    gamescene_header_png: "res/gamescene/header.png",
    gamescene_shimmer_plist: "res/gamescene/shimmer.plist",
    gamescene_shimmer_pvr: "res/gamescene/shimmer.pvr.ccz",
    gamescene_timer_png: "res/gamescene/timer.png",
    splashscene_about_background_png: "res/mainscene/about-bg.png",
    splashscene_about_fade_png: "res/mainscene/about-fade.png",
    splashscene_btn_about_png: "res/mainscene/btn-about.png",
    splashscene_btn_about_down_png: "res/mainscene/btn-about-down.png",
    splashscene_btn_done_png: "res/mainscene/btn-done.png",
    splashscene_btn_done_down_png: "res/mainscene/btn-done-down.png",
    splashscene_btn_play_png: "res/mainscene/btn-play.png",
    splashscene_btn_play_down_png: "res/mainscene/btn-play-down.png",
    splashscene_logo_png: "res/mainscene/logo.png",
    clickme_png: "res/clickme.png",
    clickme_down_png: "res/clickme-down.png",
    crystals_plist: "res/crystals.plist",
    crystals_pvr: "res/crystals.pvr.ccz",
    MainScene_ccbi: "res/MainScene.ccb"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}