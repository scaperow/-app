angular.module('starter.controllers', ['ngResource', 'ionicLazyLoad'])
    .run(function ($rootScope, $state, $ionicLoading, $resource, $location, $ionicPlatform, $ionicModal, $window, User, Loading) {
        $rootScope.closeLogin = function () {
            $rootScope.loginModal.hide();
        };

        $rootScope.changePanel = function (num) {
            $rootScope.panel = num;
            $rootScope.loginData.password = '';
            $rootScope.loginData.repassword = '';
        };

        $rootScope.getValidationCode = function (username) {
            if (username) {
                var vcodeHelper = $resource(config.domain + '/mobile/vcode');
                vcodeHelper.get({mobile: username},
                    function (data) {
                        Loading.tip(data['msg']);
                    },
                    function (data) {
                        Loading.tip('应用发生异常');
                        console.log(data);
                    });
            } else {
                Loading.tip('请输入手机号码');
            }
        };

        $ionicModal
            .fromTemplateUrl('templates/login.html', {
                scope: $rootScope
            })
            .then(function (modal) {
                $rootScope.loginModal = modal;
            });

        $rootScope.register = function () {
            if ($rootScope.loginData.username && $rootScope.loginData.password && $rootScope.loginData.repassword && $rootScope.loginData.vcode) {
                if ($rootScope.loginData.password == $rootScope.loginData.repassword) {
                    Loading.show();
                    var loginHelper = $resource(config.domain + '/mobile/register');
                    loginHelper.save({
                            mobile: $rootScope.loginData.username,
                            password: hex_md5($rootScope.loginData.password),
                            apassword: hex_md5($rootScope.loginData.repassword),
                            vcode: $rootScope.loginData.vcode
                        },
                        function (data) {
                            Loading.close();

                            if (data.flag == 1) {
                                $rootScope.user = data['msg'];
                                $rootScope.loginModal.hide();
                                localStorage["username"] = $rootScope.loginData.username;
                                localStorage["password"] = hex_md5($rootScope.loginData.password);

                                $state.go('tab.account');
                            } else {
                                $rootScope.tip(data['msg']);
                            }

                            $rootScope.loginData.password = '';
                            $rootScope.loginData.repassword = '';
                        },
                        function (data) {
                            $rootScope.tip('应用异常');
                            $rootScope.loginData.password = '';
                            $rootScope.loginData.repassword = '';
                            console.log(data)
                        });
                }
                else {
                    $rootScope.tip('两次密码输入不一致，请重新输入');
                }
            }
            else {
                $rootScope.tip('注册信息输入不完整，请检查');
            }
        };

        $rootScope.login = function () {
            if ($rootScope.loginData.username && $rootScope.loginData.password) {
                Loading.show();

                User
                    .login($rootScope.loginData.username, hex_md5($rootScope.loginData.password))
                    .then(function () {
                        Loading.close();
                        User.syncProfile();

                        $rootScope.loginModal.hide();

                        var next = $rootScope.next;
                        if (next) {
                            $state.go(next);
                        }
                    })
                    .catch(function (err) {
                        if (err && err.msg) {
                            return Loading.tip(err.msg);
                        }

                        Loading.tip('应用发生异常');
                        console.log(err);
                    });
            }
            else {
                Loading.tip('请输入用户名和密码');
            }
        };

        $window.addEventListener('online', function () {
            $location.reload();
            $ionicLoading.hide();
        });

        $window.addEventListener('offline', function () {
            $ionicLoading.show({
                template: '没有网络不能操作'
            });
        });

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                var validate = function () {
                    if (toState.validate === true && User.hasValid() === false) {

                        $rootScope.loginData = {};
                        $rootScope.next = toState.name;
                        $rootScope.panel = 1;
                        $rootScope.loginModal.show();

                        return false;
                    }

                    return true;
                };

                var hideTabs = function () {
                    if (toState.hideTabs) {
                        $rootScope.tohide = "tabs-item-hide";
                    } else {
                        $rootScope.tohide = "";
                    }
                };

                if (validate() == false) {
                    event.preventDefault();
                    $state.go(fromState.name);
                    $rootScope.next = toState.name;
                    $rootScope.$broadcast('$stateChangeSuccess', toState, toParams, fromState, fromParams);
                    return;
                }

                hideTabs();
            }
        );

        $rootScope.$on('loginSuccess',
            function (event, user) {
                var setTagsWithJPush = function () {
                    $ionicPlatform.ready(function () {
                        var tags = ['user'],
                            alias = user.mobile;

                        if (user.mobile == '13239109398') {
                            tags.push('administrator');
                        }

                        try {
                            window.plugins.jPushPlugin.setTagsWithAlias(tags, alias);
                        } catch (e) {
                            console.log(e);
                        }
                    });
                };

                setTagsWithJPush();
            });

        $ionicPlatform.ready(function () {
            try {
                $window.plugins.jPushPlugin.init();
                $window.plugins.jPushPlugin.resetBadge();
            } catch (e) {
                console.log(e);
            }
        });

        User.loginBackend();
    })

    .controller('CommentCtrl', function ($http, $resource, $scope, $state, Loading, User) {
        var psid = $state.params.psid,
            oiid = $state.params.oiid;

        Loading.close();
        $scope.comment = {
            productRate: 0,
            speedRate: 0,
            priceRate: 0,
            serviceRate: 0,
            psid: psid,
            oiid: oiid,
            userId: User.current().id
        };

        $scope.rateProduct = function (rate) {
            $scope.comment.productRate = rate;
        }

        $scope.rateSpeed = function (rate) {
            $scope.comment.speedRate = rate;
        }

        $scope.ratePrice = function (rate) {
            $scope.comment.priceRate = rate;
        }

        $scope.rateService = function (rate) {
            $scope.comment.serviceRate = rate;
        }

        $scope.save = function () {
            var comment = $scope.comment;
            if (!comment.content) {
                return Loading.tip('请填些评价内容', 1200);
            }

            var resource = $resource(config.domain + '/mobile/comment/add');
            resource.save(comment,
                function () {
                    Loading.tip('您已评价，谢谢');
                    $scope.$root.$broadcast('comment', {comment: comment});
                    window.history.back();

                },
                function () {
                    Loading.tip('应用发生异常');
                    console.log(result);
                });
        };
    })

    .controller('CommentsCtrl', function ($http, $resource, $scope, $state, $ionicScrollDelegate, User, Loading) {
        var refresh = function () {
            Loading.show();
            var resource = $resource(config.domain + '/mobile/comment/list');
            resource.get({
                    userId: $scope.userId,
                    psid: $scope.psid,
                    index: $scope.index,
                    size: $scope.size
                },

                function (result) {
                    if (result) {
                        if (result.items && result.items.length > 0) {
                            $scope.index++;

                            if ($scope.comment) {
                                result.items = _.union(result.items, $scope.comment.items);
                            }

                            $scope.comment = result;
                            Loading.close();
                            $ionicScrollDelegate.resize();

                            return;
                        }
                    }

                    Loading.tip('没有更多的评论了');
                },
                function (err) {
                    console.log(err);
                    Loading.tip('应用异常');
                });

        };

        $scope.index = $scope.index || 1;
        $scope.size = $scope.size || 20;
        $scope.userId = User.current().id;
        $scope.psid = $state.params.psid;
        $scope.load = function () {
            refresh();
        }

        refresh();
    })

    /*首页control*/
    .controller('HomeCtrl', function ($scope, $resource, $state, $ionicPopup, $window, $ionicNavBarDelegate, $ionicScrollDelegate, Loading) {
        Loading.show();

        //var adHelper = $resource(config.domain + '/mobile/ads');
        //adHelper.query(
        //    function (data) {
        //       Loading.close();
        //        $scope.ads = _.map(data, function (item) {
        //            item.img = config.domain + '/upload/ad/' + item.img;
        //            return item;
        //        });
        //        $ionicSlideBoxDelegate.update();
        //    },
        //    function (data) {
        //        Loading.tip('应用异常');
        //        console.log(data);
        //    });

        var homeHelper = $resource(config.domain + '/mobile/home');
        homeHelper.get(
            function (homeData) {
                Loading.close();
                $scope.fruits = _.map(homeData.f, function (item) {
                    item.img = config.domain + '/upload/' + item.sku + '/' + item.cover;
                    return item;
                });
                $scope.vegetables = _.map(homeData.v, function (item) {
                    item.img = config.domain + '/upload/' + item.sku + '/' + item.cover;
                    return item;
                });
                $scope.items = $scope.vegetables;
                $scope.display = 'v';
            },
            function (data) {
                Loading.tip('应用异常');
                console.log(data)
            });

        $scope.showDetail = function (id) {
            $state.go($state.$current.name + '-product', {id: id});
        };

        $scope.titleClick = function (type) {
            if ($scope.display != type) {
                switch (type) {
                    case 'v':
                        $scope.items = $scope.vegetables;
                        break;
                    case 'f':
                        $scope.items = $scope.fruits;
                }

                $scope.display = type;
                $ionicScrollDelegate.scrollTop();
            }
        };

        //$scope.doPhone = function () {
        //    var confirmPopup = $ionicPopup.confirm({
        //        title: '通过在线支付方式购买更优惠，您确定继续拨打400电话进行订购吗？',
        //        cancelText: '取消',
        //        okText: '继续拨打'
        //    });
        //
        //    confirmPopup.then(function (res) {
        //        if (res) {
        //            $window.open('tel:400-967-6558', '_system');
        //        }
        //    });
        //};

        $scope.search = function () {
            $state.go('tab.search');
        };
    })

    /*产品详情页control*/
    .controller('ProductCtrl', function ($scope, $resource, $state, $window, $location, $ionicPopup, $ionicSlideBoxDelegate, $ionicNavBarDelegate, $controller, User, Favorite, ShopCar, Loading) {
        $controller('HomeCtrl', {$scope: $scope});

        var productHelper = $resource(config.domain + '/mobile/product/' + $state.params.id),
            load = function () {
                Loading.show();
                productHelper.get(
                    function (product) {
                        if (product.status === 1) {
                            Loading.close();
                            product.pics = _.map(product.pics, function (item) {
                                item.img = config.domain + '/upload/' + product.sku + '/' + item.img;
                                return item;
                            });

                            $scope.product = product;
                            $scope.favorite = Favorite.contains(product.psid);
                            $scope.saveprice = Math.round($scope.product.orginalprice - $scope.product.ourprice);
                            $ionicSlideBoxDelegate.update();
                            $ionicNavBarDelegate.title($scope.product.name);
                        }
                        else {
                            $window.history.back();
                            Loading.tip('抱歉,该商品暂时不可用或已下架');
                        }
                    },
                    function (data) {
                        Loading.tip('应用异常');
                        console.log(data);
                    });
            };


        $scope.cancelFavorite = function (id) {
            var userId = null;
            if (User.current()) {
                userId = User.current().id;
            }

            Favorite.remove(userId, id);
        };
        $scope.doFavorite = function (id) {
            if ($scope.favorite) {
                $scope.cancelFavorite(id);
            } else {
                $scope.favoriteProduct(id);
            }

            $scope.favorite = !$scope.favorite;
        };
        $scope.favoriteProduct = function (id) {
            var userId = null;
            if (User.current()) {
                userId = User.current().id;
            }

            Favorite.add(userId, id);
        };
        $scope.buy = function () {
            var resource = $resource(config.domain + '/mobile/shopcar');
            Loading.show();
            resource.query({psid: '[' + $scope.product.psid + ']'}
                , function (products) {
                    Loading.close();
                    _.each(products, function (product) {
                        ShopCar.put({
                            pid: $scope.product.pid,
                            psid: $scope.product.psid,
                            quantity: $scope.quantity,
                            product: product,
                            checked: true
                        });

                        Loading.tip('已加入到购物车', 1000);
                    });
                }
                , function (error) {
                    Loading.tip('应用异常');
                    console.log(error);
                });

        };
        $scope.addQuantity = function (num) {
            $scope.quantity = $scope.quantity + num;

            if ($scope.quantity > 99) {
                $scope.quantity = 99;
            }
            else if ($scope.quantity < 1) {
                $scope.quantity = 1;
            }
        };
        $scope.showDetail = function () {
            $state.go($state.current.name + '-detail', {id: $scope.product.psid});
        };
        $scope.showComments = function (psid) {
            $state.go($state.$current.name + '-comments', {psid: $scope.product.psid});
        };
        $scope.share = function (psid) {
            var title = '新鲜' + $scope.product.name + '只需' + $scope.product.price + ' 元,只在易凡网',
                url = 'http://www.eofan.com/product/' + psid;

            $window.plugins.socialsharing.share(title, null, null, url);
        };

        $scope.favorite = true;
        $scope.quantity = 1;

        load();
    })

    /*产品图片详情页control*/
    .controller('PDetailCtrl', function ($scope, $resource, $state, Loading) {
        var productHelper = $resource(config.domain + '/mobile/pdetail/' + $state.params.id);
        Loading.show()
        productHelper.query(
            function (pics) {
                Loading.close();
                $scope.pics = _.map(pics, function (item) {
                    item.img = config.domain + '/upload/' + item.img;
                    return item;
                });
            },
            function (data) {
                Loading.close();
                Loading.tip('应用异常');
                console.log(data)
            });
    })

    /*
     *分类查找产品control
     */
    .controller('CategoriesCtrl', function ($scope, $resource, $state, $ionicScrollDelegate, Loading) {
        Loading.show();
        var categoryHelper = $resource(config.domain + '/mobile/category');
        categoryHelper.query(
            function (data) {
                Loading.close();
                $scope.categories = data;

                if (data && data.length > 0) {
                    var choose = data[0];

                    var exists = _.find(data, function (item) {
                        return (item && item.code && item.code.length === 4);
                    });

                    if (exists) {
                        choose = exists;
                    }

                    $scope.choose = choose.name;
                    $scope.showProduct(choose.code.replace(/'/g, ""), choose.name);
                }
            },
            function (data) {
                Loading.tip('应用异常');
                console.log(data)
            });

        var productHelper = $resource(config.domain + '/mobile/products');
        $scope.showProduct = function (code, name) {
            Loading.show();
            $scope.choose = name;
            productHelper.query({code: code},
                function (data) {
                    Loading.close();
                    $scope.products = _.map(data, function (item) {
                        item.img = config.domain + '/upload/' + item.sku + '/' + item.cover;
                        return item;
                    });

                    $ionicScrollDelegate.$getByHandle('categoriesProductScroll').scrollTop();
                },
                function (data) {
                    Loading.tip('应用异常');
                    console.log(data);
                });
        };

        $scope.showDetail = function (id) {
            $state.go($state.$current.name + '-product', {id: id});
        };
    })

    /*
     * 查找control
     */
    .controller('SearchCtrl', function ($scope, $state, $resource, Loading) {
        $scope.keywords = '';
        $scope.searchProduct = function () {
            if ($scope.keywords.length > 0) {
                Loading.show()
                var searchHelper = $resource(config.domain + '/mobile/search');
                searchHelper.query({keywords: $scope.keywords},
                    function (data) {
                        Loading.close();
                        $scope.products = _.map(data, function (item) {
                            item.img = config.domain + '/upload/' + item.sku + '/' + item.cover;
                            return item;
                        });
                    },
                    function (data) {
                        Loading.tip('应用异常');
                        console.log(data);
                    });

            }
            else {
                Loading.tip('请输入要搜索的产品名称');
            }
        };

        $scope.showDetail = function (id) {
            $state.go($state.$current.name + '-product', {id: id});
        };
    })

    /*用户中心control*/
    .controller('AccountCtrl', function ($scope, $state, $resource, $ionicPopup, User) {
        $scope.logout = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: '您确定要退出易凡网吗？',
                cancelText: '取消',
                okText: '确定'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    User.logout();
                    $state.go('tab.home');
                }
            });
        };
        $scope.buyWithPhone = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: '通过在线支付方式购买更优惠，您确定继续拨打400电话进行订购吗？',
                cancelText: '取消',
                okText: '继续拨打'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    $window.open('tel:400-967-6558', '_system');
                }
            });
        };
        $scope.user = User.current();
    })

    /*我的订单control*/
    .controller('OrderCtrl', function ($scope, $state, $resource, $ionicScrollDelegate, User, MyOrders, Loading) {
        var query = function (type) {
            Loading.show()

            MyOrders
                .query(User.current().id, $scope.index, $scope.size, type).$promise
                .then(function (result) {
                    Loading.close();

                    if (result && result.items.length > 0) {
                        $scope.orders = _.union($scope.orders, result.items);
                        $scope.total = result.total;
                        $scope.index += 1;
                        $ionicScrollDelegate.resize();
                    } else {
                        Loading.tip('没有更多订单了');
                    }
                }, function (error) {
                    Loading.tip('应用异常');
                    console.log(error);
                });
        };

        $scope.load = function () {
            query($scope.choose || 'all', $scope.index || 'indexOfAll');
        };
        $scope.switch = function (choose) {
            $scope.orders = [];
            $scope.choose = choose;
            $scope.index = 1;

            $ionicScrollDelegate.scrollTop();
            switch (choose) {
                case 'all':
                    query(choose, 'indexOfAll');
                    break;

                case 'unpay':
                    query(choose, 'indexOfUnPay');
                    break;

                case 'unway':
                    query(choose, 'indexOfUnWay');
                    break;

            }
        };
        $scope.showDetail = function (oid, status) {
            $state.go('tab.order-detail', {id: oid});
        };
        $scope.index = 1;
        $scope.choose = 'all';

        query('all');
    })

    /*订单详情control*/
    .controller('OrderDetailCtrl', function ($scope, $state, $resource, $http, AliPay, MyOrders, Loading) {
        var id = $state.params.id,
            loadDetail = function (id) {
                orderHelper.get({id: id},
                    function (data) {
                        Loading.close();
                        $scope.order = data;

                        loadExpress(data.deliverynum);
                    },
                    function (data) {
                        Loading.tip('应用异常');
                        console.log(data);
                    });
            },
            loadExpress = function (devilyNumber) {
                $http.get('http://www.kuaidi100.com/query?type=zhaijisong&postid=' + devilyNumber)
                    .success(function (result) {
                        if (result) {
                            if (result.status == '200') {
                                return $scope.expresses = result.data;
                            }
                        }

                        $scope.expressProgress = '正在发货';
                        console.log(result);

                    })
                    .error(function (result) {
                        $scope.expressProgress = '查询异常,请稍后再试';
                    });
            },
            orderHelper = $resource(config.domain + '/mobile/orderdetail');

        Loading.show()
        $scope.expressProgress = '正在查询, 请稍后';
        $scope.status = status;
        $scope.continuePay = function () {
            Loading.show()
            var resource = $resource(config.domain + '/mobile/pay');
            resource.save($scope.order,
                function (result) {
                    if (result && result.flag === 2) {
                        AliPay.pay(result.url, $state.params.id, $scope, $state);
                    } else {
                        Loading.tip(result.msg);
                    }
                },
                function (result) {
                    Loading.tip('支付失败，请稍后再试');
                    console.log(result);
                }
            );
        };
        $scope.cancelOrder = function () {
            Loading.show()
            var orderHelper = $resource(config.domain + '/mobile/cancelorder');
            orderHelper.query({id: $state.params.id}, function (data) {
                    Loading.close();
                    if (data.flag == 1) {
                        MyOrders.cancelOrder($state.params.id);
                        $scope.$root.allOrders = MyOrders.allOrders();
                        $scope.$root.payOrders = MyOrders.payOrders();
                        $scope.$root.cancelOrders = MyOrders.cancelOrders();
                        $state.go('tab.order');
                    }
                    else {
                        Loading.tip(data.msg);
                    }
                },
                function (data) {
                    Loading.close();
                    Loading.tip('应用异常');
                    console.log(data);
                });
        };
        $scope.comment = function (oiid, psid) {
            $state.go('tab.order-comment', {oiid: oiid, psid: psid});
        };
        $scope.$root.$on('comment', function (event, data) {
            var comment = data.comment;

            $scope.order.items = _.map($scope.order.items, function (item) {
                if (item.id == comment.oiid) {
                    item.hascomment = 1;
                }

                return item;
            });
        });

        loadDetail(id);
    })

    /*购物车Control*/
    .controller('CarCtrl', function ($scope, $resource, $filter, $state, $ionicPopup, User, ShopCar, Loading) {
        Loading.show();
        $scope.cars = ShopCar.all();
        $scope.config = config;
        $scope._ = _;
        Loading.close();

        var resume = function () {
            $scope.total = ShopCar.resume($scope.cars);
        };

        $scope.$watch('cars', function () {
            resume();
        }, true);

        $scope.addQuantity = function (pid, psid, num) {
            ShopCar.addQuantity($scope.cars, pid, psid, num);
        };

        $scope.pay = function (pid, psid) {
            ShopCar.pay(_.where($scope.cars, {checked: true}));
            $state.go('tab.pay');
        };

        $scope.checkAll = function () {
            _.each($scope.cars, function (car) {
                car.checked = true;
            });
        };

        $scope.removeCar = function (pid, psid) {
            var confirm = $ionicPopup.show({
                title: '询问',
                template: '是否要从购物车移除?',
                buttons: [
                    {
                        text: '<b >是</b>',
                        type: 'button-positive',
                        onTap: function () {
                            var userId = null;
                            if (User.current()) {
                                userId = User.current().id;
                            }

                            ShopCar.remove(userId, {pid: pid, psid: psid});
                        }
                    },
                    {
                        text: '否'
                    }
                ]
            });
        };

        $scope.showDetail = function (pid) {
            $state.go('tab.car-product', {id: pid});
        };
    })

    /*
     *支付Control
     */
    .controller('PaymentCtrl', function ($scope, $state, $filter, $ionicPopup, $resource, AliPay, $sce, $http, $ionicPlatform, ShopCar, MyAddress, User, Loading) {
        var order = {},
            cars = ShopCar.pay(),
            total = 0,
            items = [],
            user = User.current(),
            resource = $resource(config.domain + '/mobile/payinfo');

        _.each(cars, function (car) {
            var t = $filter('number')((car.quantity * car.product.price), 2);
            total += parseFloat(t);

            items.push(_.pick(car, 'psid', 'quantity'));
        });

        Loading.show();
        resource.get({
                userid: user.id,
                price: order.currentprice
            },
            function (result) {
                Loading.close();
                user.addresses = result.address;
                user.balance = result.balance;
                //user.balance = 200;
                defaultAddress = MyAddress.getDefaultAddress(user.addresses);
                if (defaultAddress) {
                    order.addrid = 0 || defaultAddress.id;
                }
            },
            function (error) {
                console.log(error);
                Loading.tip('应用异常');
            }),
            resume = function () {
                $scope.amount = parseFloat($filter('number')($scope.order.currentprice - $scope.balance - $scope.coupon, 2));
            };

        order.price = parseFloat($filter('number')(total, 2));
        order.currentprice = order.price;
        order.shippingprice = 0;
        order.offPrice = 0;
        order.delivery_day = '';
        order.items = items;
        order.payment = '1';
        order.coupon_code = '';
        order.coupon = 0;
        order.userid = user.id;
        order.msg = '';
        order.balance = 0;

        $scope.expandAddress = function () {
            $scope.showAllAddress = true;
        };
        $scope.collapseAddress = function () {
            $scope.showAllAddress = false;
            var user = User.current();
            _.each(user.addresses, function (address, index) {
                if (address.id == user.defaultAddressID) {
                    user.addresses.splice(0, 0, user.addresses.splice(index, 1)[0]);
                }
            });
        };
        $scope.pay = function () {
            resume();
            order.currentprice = $scope.amount;

            if ($scope.payUseCoupon) {
                order.coupon_code = $scope.couponCode;
            }

            if (order.payment == '1') {//支付宝
                //order.currentprice = 0.01;
                if ($scope.payUseBalance) {
                    order.balance = $scope.balance;
                    order.payment = '4';
                }

                if (ionic.Platform.isAndroid() || ionic.Platform.isIOS() || ionic.Platform.isIPad()) {
                    Loading.show();
                    var resource = $resource(config.domain + '/mobile/pay');

                    resource.save(order,
                        function (result) {
                            ShopCar.remove(user.id, cars);
                            if (result && result.flag === 2) {
                                AliPay.pay(result.url, result.orderid, $scope, $state);
                            } else {
                                Loading.tip(result.msg);
                            }
                        },
                        function (result) {
                            alert('8');
                            Loading.tip('提交订单失败');
                            console.log(result);
                        }
                    );
                } else {
                    Loading.tip('支付平台不支持该设备，请选择货到付款');
                }
            }
            else if (order.payment == '0') {//货到付款
                Loading.show();
                var resource = $resource(config.domain + '/mobile/pay');

                resource.save(order,
                    function (result) {
                        ShopCar.remove(user.id, cars);
                        if (result && result.flag === 1) {
                            Loading.tip('订单下单成功,感谢购买');
                            $state.go('tab.account');
                        } else {
                            Loading.tip(result.msg);
                        }
                    },
                    function (result) {
                        Loading.tip('提交订单失败');
                        console.log(result);
                    }
                );
            }
            else {//余额支付
                if ($scope.payUseBalance) {
                    var resource = $resource(config.domain + '/mobile/pay');

                    order.payment = '2';
                    order.balance = $scope.balance;

                    Loading.show();

                    resource.save(order,
                        function (result) {
                            ShopCar.remove(user.id, cars);
                            if (result && result.flag === 1) {
                                user.balance -= order.balance;
                                Loading.tip('下单成功, 感谢购买');
                                $state.go('tab.account');
                            } else {
                                Loading.tip(result.msg);
                            }
                        },
                        function (result) {
                            Loading.tip('提交订单失败');
                            console.log(result);
                        }
                    );
                }
            }
        };
        $scope.setAddress = function (id) {
            $scope.order.addrid = id;
            $scope.showAllAddress = false;
        };
        $scope.modifyAddress = function (id) {
            $scope.$root.new = false;
            $scope.$root.address = MyAddress.getAddressByID(id, User.current().addresses);
            $state.go('tab.address-edit-order', {id: id});
        };
        $scope.newAddress = function (id) {
            $scope.$root.new = true;
            $scope.$root.address = {
                province: '陕西省',
                city: '西安市',
                userid: User.current().id,
                tel: '',
                mobile: ''
            };
            $state.go('tab.address-edit-order', {id: id});
        };
        $scope.cancelPayment = function () {
            $scope.paymentModal.hide();
        };
        $scope.useBalance = function () {
            var coupon = $scope.coupon || 0,
                balance = User.current().balance || 0,
                total = $scope.order.currentprice - coupon;

            if (total <= 0) {
                return Loading.tip('当前价格不需要支付');
            }

            if (balance <= 0) {
                return Loading.tip('您的余额不足, 请充值');
            }

            $state.go('tab.pay-balance', {total: total, balance: 200});
        };
        $scope.useCoupon = function () {
            var balance = $scope.balance,
                total = $scope.order.currentprice - balance;

            $state.go('tab.pay-coupon', {total: total});
        };

        $scope.$root.$on('pay-balance', function (event, data) {
            $scope.balance = parseFloat($filter('number')(data.use, 2));
            $scope.payUseBalance = true;
            resume();
            if ($scope.amount === 0) {
                order.payment = '2';
            }
        });
        $scope.$root.$on('cancel-balance', function (event, data) {
            $scope.balance = 0;
            $scope.payUseBalance = false;
            resume();
            if ($scope.amount > 0) {
                order.payment = '1';
            }
        });
        $scope.$root.$on('pay-coupon', function (event, data) {
            $scope.coupon = parseFloat($filter('number')(data.amount, 2));
            $scope.couponCode = data.coupon.code;
            $scope.payUseCoupon = true;
            resume();
            if ($scope.amount > 0) {
                order.payment = '2';
            }
        });
        $scope.$root.$on('cancel-coupon', function (event, data) {
            $scope.coupon = 0;
            $scope.payUseCoupon = false;
            resume();
            if ($scope.amount > 0) {
                order.payment = '2';
            }
        });
        $scope.parseFloat = parseFloat;

        $scope.showAllAddress = false;
        $scope.balance = $scope.coupon = 0;
        $scope.order = order;
        $scope.user = user;

        resume();
    })

    /*
     使用余额路由
     */
    .controller('BalanceCtrl', function ($scope, $state, $filter, $window, User, Loading) {
        var total = parseFloat($filter('number')($state.params.total, 2)),
            balance = parseFloat($filter('number')($state.params.balance, 2));

        $scope.total = total;
        $scope.balance = balance;
        $scope.use = balance > total ? total : balance;
        $scope.value = $scope.use;
        $scope.$watch('value', function (value, old) {
            var value = $filter('number')(value, 2);

            if (value !== old && value <= $scope.balance) {
                $scope.use = value > total ? total : value;
            }
        });
        $scope.pay = function () {
            $scope.$root.$broadcast('pay-balance', {use: $scope.use, total: $scope.total});
            $window.history.back();
        };
        $scope.cancel = function () {
            $scope.$root.$broadcast('cancel-balance');
            Loading.tip('已取消使用余额支付');
            $window.history.back();
        };
    })

    /*
     使用优惠券路由
     */
    .controller('CouponPayCtrl', function ($scope, $state, $window, $resource, $ionicScrollDelegate, User, Loading) {
        var total = $state.params.total,
            query = function (type) {
                var resource = $resource(config.domain + '/mobile/coupons');
                Loading.show();
                resource.query({
                    userid: User.current().id,
                    type: type
                }, function (result) {
                    $scope.coupons = _.reject(result, function (coupon) {
                        return total <= coupon.minprice;
                    });
                    $ionicScrollDelegate.resize();
                    Loading.close();
                }, function (err) {
                    console.log(err);
                    Loading.tip('应用异常');
                });
            };

        $scope.total = total;
        $scope.pay = function (code) {
            var exists = _.where($scope.coupons, {code: code});
            if (exists.length === 0) {
                return Loading.tip('选择失败请重试');
            }

            var use = exists[0];
            if (use.price > total) {
                return Loading.tip('支付券金额不能大于商品金额');
            }

            $scope.$root.$broadcast('pay-coupon', {total: total, coupon: use, amount: use.price});
            $window.history.back();
        };
        $scope.cancel = function () {
            Loading.tip('已取消使用优惠券支付');
            $scope.$root.$broadcast('cancel-coupon');
            $window.history.back();
        }

        query('unuse');
    })

    /*
     我的优惠券路由
     */
    .controller('CouponsCtrl', function ($scope, $state, $window, $ionicScrollDelegate, $resource, User, Loading) {
        var query = function (type) {
            var resource = $resource(config.domain + '/mobile/coupons');
            Loading.show();
            resource.query({
                userid: User.current().id,
                type: type
            }, function (result) {
                $scope.coupons = result;
                $ionicScrollDelegate.resize();
                Loading.close();
            }, function (err) {
                console.log(err);
                Loading.tip('应用异常');
            });
        };

        $scope.switch = function (type) {
            $ionicScrollDelegate.scrollTop();
            $scope.choose = type;
            query(type);
        };

        $scope.switch('unuse');
    })

    /*我的收藏Control*/
    .controller('FavoriteCtrl', function ($scope, $state, $resource, $ionicPopup, $ionicLoading, User, Favorite, Loading) {
        Loading.show()
        var favoriteHelper = $resource(config.domain + '/mobile/favorite');
        favoriteHelper.query({userid: User.current().id},
            function (data) {
                Loading.close();
                $scope.items = _.map(data, function (item) {
                    item.img = config.domain + '/upload/' + item.sku + '/' + item.cover;
                    return item;
                });
                Favorite.mine = $scope.items;
                Favorite.scope = $scope;
            },
            function (data) {
                Loading.tip('应用异常');
                console.log(data)
            });
        $scope.showDetail = function (id) {
            $state.go($state.$current.name + '-product', {id: id});
        };
    })

    /*账户余额control*/
    .controller('CostCtrl', function ($scope, $state, $resource, AliPay, User, Loading) {
        Loading.show()
        $scope.$root.czprice = '';
        var costHelper = $resource(config.domain + '/mobile/balance');
        costHelper.get({userid: User.current().id},
            function (data) {
                Loading.close();
                $scope.balances = data;
                $scope.inPay = _.filter(data.items, function (item) {
                    return item.stype == '收入'
                });
                $scope.outPay = _.filter(data.items, function (item) {
                    return item.stype == '支出'
                });
                $scope.tabCost = 1;
                $scope.aStyle = 'button-positive';
                $scope.inStyle = '';
                $scope.outStyle = '';
            },
            function (data) {
                Loading.tip('应用异常');
                console.log(data)
            });

        $scope.typeClick = function (type) {
            $scope.tabCost = type;
            if (type == 1) {
                $scope.aStyle = 'button-positive';
                $scope.inStyle = '';
                $scope.outStyle = '';
            }
            else if (type == 2) {
                $scope.aStyle = '';
                $scope.inStyle = 'button-positive';
                $scope.outStyle = '';
            }
            else if (type == 3) {
                $scope.aStyle = '';
                $scope.inStyle = '';
                $scope.outStyle = 'button-positive';
            }
        };

        $scope.chongzhi = function () {
            Loading.show()
            var resource = $resource(config.domain + '/mobile/alipay_cz');
            resource.save({price: $scope.$root.czprice, userid: User.current().id},
                function (result) {
                    if (result && result.flag === 1) {
                        AliPay.cz(result.url, $scope, $state);
                    }
                    else {
                        Loading.tip(result.msg);
                    }
                },
                function (result) {
                    Loading.tip('提交订单失败');
                    console.log(result);
                }
            );
        };
    })

    /*地址管理control*/
    .controller('AddressCtrl', function ($scope, $state, $resource, $rootScope, MyAddress, $window, User, Loading) {
        var user = User.current(),
            resource = $resource(config.domain + '/mobile/address'),
            fetch = function () {
                Loading.show();

                resource.query({userid: user.id},
                    function (data) {
                        Loading.close();
                        user.addresses = data;
                    },
                    function (err) {
                        console.log(err);
                        Loading.tip('应用异常');
                    });
            };

        $scope.newAddress = function () {
            $scope.$root.new = true;
            $scope.$root.address = {
                province: '陕西省',
                city: '西安市',
                userid: User.current().id,
                tel: '',
                mobile: ''
            };
            $state.go('tab.address_edit');
        };
        $scope.changeRange = function () {
            $scope.$root.streets = MyAddress.getCurrentStreets($scope.$root.address.region);
        };
        $scope.modifyAddress = function (id) {
            $scope.$root.new = false;
            $scope.$root.address = MyAddress.getAddressByID(id, User.current().addresses);
            $scope.changeRange();
            $state.go('tab.address_edit', {id: id});
        };
        $scope.setAsDefault = function (id) {
            Loading.show();
            var resource = $resource(config.domain + '/mobile/defaultaddress');
            resource.get({id: id}, function (data) {
                Loading.close();
                if (data.flag == 1) {
                    Loading.tip('设置成功');
                    MyAddress.setDefaultAddress(id, User.current().addresses);
                    $window.history.back();
                } else {
                    Loading.tip(data.msg);
                }
            });
        };
        $scope.saveNewAddress = function () {
            Loading.show();
            var address = $scope.$root.address;
            address.tel = '';
            var resource = $resource(config.domain + '/mobile/addaddress');
            resource.save(address,
                function (data) {
                    Loading.close();
                    if (data.flag == 1) {
                        Loading.tip('保存成功');
                        MyAddress.newAddress(data.msg, User.current().addresses);
                        $window.history.back();
                    } else {
                        $rootScope.tip(data.msg);
                    }
                },
                function () {
                    Loading.close();
                    $rootScope.tip('应用异常');
                });
        };
        $scope.saveModifyAddress = function () {
            Loading.show();
            var address = $scope.$root.address;
            var resource = $resource(config.domain + '/mobile/updateaddress');
            resource.save(address,
                function (data) {
                    Loading.close();
                    if (data.flag == 1) {
                        Loading.tip('保存成功');
                        MyAddress.updateAddress(address, User.current().addresses);
                        $window.history.back();
                    } else {
                        $rootScope.tip(data.msg);
                    }
                },
                function () {
                    Loading.close();
                    $rootScope.tip('应用异常');
                });
        };
        $scope.addressSubmit = function () {
            var address = $scope.$root.address;
            if (address.region && address.address && address.name && address.mobile) {
                if ($scope.new) {
                    $scope.saveNewAddress();
                } else {
                    $scope.saveModifyAddress();
                }
            }
            else {
                Loading.tip('地址信息输入不完整，请检查');
            }
        };
        $scope.deleteAddress = function (id) {
            Loading.show();
            var resource = $resource(config.domain + '/mobile/deladdress');
            resource.get({id: id},
                function (data) {
                    Loading.close();
                    if (data.flag == 1) {
                        MyAddress.delAddress(id, $scope);
                        $rootScope.tip('删除成功');
                        $window.history.back();
                    } else {
                        $rootScope.tip(data.msg);
                    }
                },
                function () {
                    Loading.close();
                    Loading.tip('应用异常');
                });
        };

        $scope.user = user;
        fetch();
    })

    /*Tabs control*/
    .controller('TabsCtrl', function ($scope, $state, ShopCar) {
        $scope.$on('removeCar', function () {
            $scope.cars = ShopCar.all();
        });

        $scope.$on('putCar', function () {
            $scope.cars = ShopCar.all();
        });

        $scope.cars = ShopCar.all();
    });


