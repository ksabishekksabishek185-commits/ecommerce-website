const CACHE_NAME =
    "expiry-alert-system-v5";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./script.js",

    "./manifest.json"

];


/* =====================================================
   INSTALL
===================================================== */

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )
            .then(
                function (cache) {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                }
            )

        );


        self.skipWaiting();

    }
);


/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches.keys()
                .then(
                    function (cacheNames) {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    function (name) {

                                        return name !==
                                            CACHE_NAME;

                                    }
                                )
                                .map(
                                    function (name) {

                                        return caches.delete(
                                            name
                                        );

                                    }
                                )

                        );

                    }
                )

        );


        self.clients.claim();

    }
);


/* =====================================================
   FETCH
===================================================== */

self.addEventListener(
    "fetch",
    function (event) {

        /*
           HTML / CSS / JS files should try
           network first so new code loads.
        */

        if (
            event.request.method !==
            "GET"
        ) {

            return;

        }


        event.respondWith(

            fetch(
                event.request
            )
            .then(
                function (response) {

                    const copy =
                        response.clone();


                    caches.open(
                        CACHE_NAME
                    )
                    .then(
                        function (cache) {

                            cache.put(
                                event.request,
                                copy
                            );

                        }
                    );


                    return response;

                }
            )
            .catch(
                function () {

                    return caches.match(
                        event.request
                    );

                }
            )

        );

    }
);


/* =====================================================
   PUSH
===================================================== */

self.addEventListener(
    "push",
    function (event) {

        let data = {

            title:
                "Expiry Product Alert",

            body:
                "A product needs your attention."

        };


        if (event.data) {

            try {

                data =
                    event.data.json();

            }

            catch (error) {

                data.body =
                    event.data.text();

            }

        }


        event.waitUntil(

            self.registration
                .showNotification(
                    data.title,
                    {

                        body:
                            data.body,

                        tag:
                            "expiry-alert",

                        requireInteraction:
                            true,

                        vibrate:
                            [
                                200,
                                100,
                                200
                            ]

                    }
                )

        );

    }
);


/* =====================================================
   NOTIFICATION CLICK
===================================================== */

self.addEventListener(
    "notificationclick",
    function (event) {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            })
            .then(
                function (clientList) {

                    for (
                        const client
                        of clientList
                    ) {

                        if (
                            "focus" in client
                        ) {

                            return client.focus();

                        }

                    }


                    if (
                        clients.openWindow
                    ) {

                        return clients.openWindow(
                            "./index.html"
                        );

                    }

                }
            )

        );

    }
);