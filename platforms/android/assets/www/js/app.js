// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordoprova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });


    })

    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: "/tab",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            .state('tab.home', {
                url: '/home',
                views: {
                    'tab-home': {
                        templateUrl: 'templates/tab-home.html',
                        controller: 'HomeCtrl'
                    }
                }
            })

            .state('tab.search', {
                url: '/search',
                views: {
                    'tab-home': {
                        templateUrl: 'templates/search.html',
                        controller: 'SearchCtrl'
                    }
                }
            })

            .state('tab.categories', {
                url: '/categories',
                views: {
                    'tab-category': {
                        templateUrl: 'templates/tab-categories.html',
                        controller: 'CategoriesCtrl'
                    }
                }
            })

            .state('tab.car', {
                url: '/car',
                views: {
                    'tab-car': {
                        templateUrl: 'templates/tab-car.html',
                        controller: 'CarCtrl'
                    }
                }
            })

            .state('tab.car-product-detail', {
                url: '/product/detail/:id',
                hideTabs: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/pdetail.html',
                        controller: 'PDetailCtrl'
                    }
                }
            })

            .state('tab.car-product-comments', {
                url: '/comments/:psid',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/comments.html',
                        controller: 'CommentsCtrl'
                    }
                }
            })

            .state('tab.home-product', {
                url: '/product/:id',
                hideTabs: true,
                views: {
                    'tab-home': {
                        templateUrl: 'templates/product.html',
                        controller: 'ProductCtrl'
                    }
                }
            })

            .state('tab.home-product-detail', {
                url: '/product/detail/:id',
                hideTabs: true,
                views: {
                    'tab-home': {
                        templateUrl: 'templates/pdetail.html',
                        controller: 'PDetailCtrl'
                    }
                }
            })

            .state('tab.home-product-comments', {
                url: '/product/comments/:psid',
                hideTabs: true,
                views: {
                    'tab-home': {
                        templateUrl: 'templates/comments.html',
                        controller: 'CommentsCtrl'
                    }
                }
            })

            .state('tab.categories-product', {
                url: '/product/:id',
                hideTabs: true,
                views: {
                    'tab-category': {
                        templateUrl: 'templates/product.html',
                        controller: 'ProductCtrl'
                    }
                }
            })

            .state('tab.categories-product-detail', {
                url: '/product/detail/:id',
                hideTabs: true,
                views: {
                    'tab-category': {
                        templateUrl: 'templates/pdetail.html',
                        controller: 'PDetailCtrl'
                    }
                }
            })

            .state('tab.categories-product-comments', {
                url: '/product/comments/:psid',
                hideTabs: true,
                views: {
                    'tab-category': {
                        templateUrl: 'templates/comments.html',
                        controller: 'CommentsCtrl'
                    }
                }
            })

            .state('tab.car-product', {
                url: '/product/:id',
                hideTabs: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/product.html',
                        controller: 'ProductCtrl'
                    }
                }
            })

            .state('tab.order-comment', {
                url: '/comment/:oiid/:psid',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/comment.html',
                        controller: 'CommentCtrl'
                    }
                }
            })

            .state('tab.pay', {
                url: '/pay',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/payment.html',
                        controller: 'PaymentCtrl'
                    }
                }
            })

            .state('tab.address-edit-order', {
                url: '/address_edit/:id',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/address-editor.html',
                        controller: 'AddressCtrl'
                    }
                }
            })

            .state('tab.account', {
                url: '/account',
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tab-account.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.favorite', {
                url: '/favorite',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/favorite.html',
                        controller: 'FavoriteCtrl'
                    }
                }
            })

            .state('tab.favorite-product', {
                url: '/product/:id',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/product.html',
                        controller: 'ProductCtrl'
                    }
                }
            })

            .state('tab.favorite-product-detail', {
                url: '/product/detail/:id',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/pdetail.html',
                        controller: 'PDetailCtrl'
                    }
                }
            })

            .state('tab.favorite-product-comments', {
                url: '/comments/:psid',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/comments.html',
                        controller: 'CommentsCtrl'
                    }
                }
            })

            .state('tab.address', {
                url: '/address',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/address.html',
                        controller: 'AddressCtrl'
                    }
                }
            })

            .state('tab.address_edit', {
                url: '/address_edit/:id',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/address-editor.html',
                        controller: 'AddressCtrl'
                    }
                }
            })

            .state('tab.cost', {
                url: '/cost',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/cost.html',
                        controller: 'CostCtrl'
                    }
                }
            })

            .state('tab.topup', {
                url: '/topup',
                hideTabs: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/top-up.html',
                        controller: 'CostCtrl'
                    }
                }
            })

            .state('tab.security', {
                url: '/security',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/security.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.service', {
                url: '/service',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/service.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.peisong', {
                url: '/peisong',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/service-psfw.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.gwzn', {
                url: '/gwzn',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/service-gwzn.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.gyyfw', {
                url: '/gyyfw',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/service-about.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.zffs', {
                url: '/zffs',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/service-zffs.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('tab.order-detail', {
                url: '/order-detail/:id',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/order-detail.html',
                        controller: 'OrderDetailCtrl'
                    }
                }
            })

            .state('tab.payment-order-detail', {
                url: '/order-detail/:id',
                hideTabs: false,
                validate: true,
                views: {
                    'tab-car': {
                        templateUrl: 'templates/order-detail.html',
                        controller: 'OrderDetailCtrl'
                    }
                }
            })

            .state('tab.order', {
                url: '/order',
                hideTabs: true,
                validate: true,
                views: {
                    'tab-account': {
                        templateUrl: 'templates/order.html',
                        controller: 'OrderCtrl'
                    }
                }
            })

            .state('tab.pay-balance', {
                url:'/pay/balance/:balance/:total',
                validate: true,
                views:{
                    'tab-car':{
                        templateUrl:'templates/balance.html',
                        controller:'BalanceCtrl'
                    }
                }
            })

            .state('tab.pay-coupon', {
                url:'/pay/coupon/:total',
                validate: true,
                views:{
                    'tab-car':{
                        templateUrl:'templates/coupon-pay.html',
                        controller:'CouponPayCtrl'
                    }
                }
            })

            .state('tab.coupons', {
                validate: true,
                url:'/coupons',
                views:{
                    'tab-account':{
                        templateUrl:'templates/coupons.html',
                        controller:'CouponsCtrl'
                    }
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/home');


        //Always use iOS style for all platform
        $ionicConfigProvider.tabs.style('standard');
        $ionicConfigProvider.tabs.position('bottom');
        $ionicConfigProvider.backButton.text('');
        $ionicConfigProvider.backButton.previousTitleText(false);

    });

