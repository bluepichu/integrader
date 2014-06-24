function preload(arr) {
    $(arr).each(function(){
        $("<img />").attr("src", this).appendTo("body").hide();
    });
}

//all images that need to be loaded for all pages should be loaded here
preload([
    "/images/button-back-dark.png",
    "/images/button-back-light.png",
    "/images/button-home-dark.png",
    "/images/button-home-light.png",
    "/images/button-settings-dark.png",
    "/images/button-settings-light.png",
    "/images/button-add-dark.png",
    "/images/button-add-light.png",
    "/images/button-submit-dark.png",
    "/images/button-submit-light.png",
    "/images/logo-dark.png",
    "/images/logo-light.png",
    "/images/progress-00.png",
    "/images/progress-01.png",
    "/images/progress-02.png",
    "/images/progress-03.png",
    "/images/progress-04.png",
    "/images/progress-05.png",
    "/images/progress-06.png",
    "/images/progress-07.png",
    "/images/progress-08.png",
    "/images/progress-09.png",
    "/images/progress-10.png",
    "/images/progress-11.png",
    "/images/progress-12.png"
])