angular.module('starter.services', ['ngResource'])

    /*
     用户服务
     */
    .factory('User', function ($resource, $q, $rootScope, ShopCar, Favorite) {
        var _current = null,
            valid = false,
            url = config.domain + '/mobile/login',
            resource = $resource(url);
        return {
            current: function(){
                return _current;
            },
            hasValid: function () {
                return valid;
            },
            loginBackend: function () {
                var name = localStorage['username'],
                    password = localStorage['password'],
                    deferred = $q.defer();

                if (name && password) {
                    this
                        .login(name, password)
                        .then(this.syncProfile)
                        .then(function () {
                            deferred.resolve();
                        })
                        .then(function (err) {
                            deferred.reject(err);
                        });
                }

                deferred.reject();
                return deferred.promise;
            },
            logout: function () {
                localStorage['username'] = '';
                localStorage['password'] = '';
                _current = null;
                valid = false;
            },
            login: function (userName, password) {
                var deferred = $q.defer();
                resource.save({mobile: userName, password: password},
                    function (result) {
                        if (result.flag == 1) {
                            _current = result['msg'];
                            valid = true;

                            localStorage["username"] = userName;
                            localStorage["password"] = password;

                            deferred.resolve(result);
                            $rootScope.$broadcast('loginSuccess', result);
                        } else {
                            _current = null;
                            valid = false;
                            deferred.reject(result);
                            $rootScope.$broadcast('loginFail', result);
                        }
                    },
                    function (err) {
                        _current = null;
                        valid = false;
                        console.log(err);
                        deferred.reject(err);
                        $rootScope.$broadcast('loginFail', err);
                    });

                return deferred.promise;
            },
            syncProfile: function () {
                var deferred = $q.defer(),
                    resource = $resource(config.domain + '/mobile/profile');

                if (valid) {
                    resource.get({userid: _current.id},
                        function (data) {
                            if (data.flag == 1) {
                                var cars = data.cars;
                                var favorites = data.favorites;

                                $q.all([ShopCar.merge(_current.id, cars), Favorite.merge(_current.id, favorites)])
                                    .then(function () {
                                        deferred.resolve();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                        deferred.reject(err);
                                    });
                            }
                        },
                        function (data) {
                            console.log(data);
                        });
                } else {
                    deferred.reject('用户未登录');
                }

                return deferred.promise;
            },
            address: {
                using: function (address) {
                    if (address) {
                        usingAddress = address;
                    } else {
                        return usingAddress;
                    }
                },
                new: true,
                modify: function (object) {

                },
                /*
                 从服务器获取该id对应的地址信息
                 */
                pull: function (id) {
                },
                /*
                 从本地查找地址信息
                 */
                find: function (id) {

                },
                /*
                 从本地和远程中删除该地址信息
                 */
                del: function (id) {

                }
            }
        };
    })

    /*
     收藏服务
     */
    .factory('Favorite', function ($resource, $q) {
        var local = [];
        if (window.localStorage['favorite']) {
            local = angular.fromJson(window.localStorage['favorite']);
        }

        return {
            mine: [],
            scope: null,
            push: function (userId, items) {
                if (!userId) {
                    return;
                }

                var resource = $resource(config.domain + '/mobile/mergefav');
                resource.save({userid: userId, items: items},
                    function () {

                    },
                    function (err) {
                        console.log(err);
                    });
            },
            merge: function (userId, remote) {
                var deferred = $q.defer();

                local = _.union(local, remote);
                this.push(userId, local);
                this.update(local);
                deferred.resolve();

                return deferred.promise;
            },
            all: function () {
                return local;
            },
            add: function (userId, psid) {
                if (!_.contains(local, psid)) {
                    local.push(psid);
                    this.update(local);
                    this.push(userId, local);
                }
            },
            remove: function (userId, psid) {
                if (_.contains(local, psid)) {
                    local = _.reject(local, function (i) {
                        return i === psid;
                    });

                    this.update(local);
                    this.push(userId, local);
                }

                this.mine = _.reject(this.mine, function (m) {
                    //收藏列表中 id 就是 psid
                    return m.id == psid;
                });
                if (this.scope) {
                    this.scope.items = this.mine;
                }
            },
            update: function (items) {
                window.localStorage['favorite'] = angular.toJson(items);
                return true;
            },
            contains: function (id) {
                return _.contains(local, id);
            }
        }
    })

    /*
     购物车服务
     */
    .factory('ShopCar', function ($resource, $filter, $q, $rootScope) {
        var items = [];
        var payItems = [];
        if (window.localStorage['carItems']) {
            items = angular.fromJson(window.localStorage['carItems']);
        }

        return {
            all: function () {
                return items;
            },
            items: items,
            update: function (items) {
                window.localStorage['carItems'] = angular.toJson(items);
                return true;
            },
            find: function (object) {
                var exists = _.where(items, object);
                if (exists.length > 0) {
                    return exists[0];
                }

                return null;
            },
            fetch: function () {
                var deferred = $q.defer();
                var resource = $resource(config.domain + '/mobile/shopcar');
                resource.query({psid: '[' + _.pluck(items, 'psid') + ']'}
                    , function (products) {
                        _.each(products, function (product) {
                            var exists = _.where(items, {psid: product.psid});

                            if (exists.length > 0) {
                                exists[0].product = product;
                                exists[0].checked = product.status === 1;
                            }
                        });

                        deferred.resolve(items);
                    }
                    , function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            },
            /*
             计算价格
             */
            resume: function (cars) {
                var total = 0;

                _.each(_.where(cars, {checked: true}), function (record) {
                    var t = $filter('number')((record.quantity * record.product.price), 2);
                    total += parseFloat(t);
                });

                total = $filter('number')(total, 2);

                return total;
            },
            remove: function (userId, objects) {
                if (!_.isArray(objects)) {
                    objects = [objects];
                }

                if (_.isObject(objects)) {
                     objects = [objects];

                }

                _.each(objects, function (object) {
                    needremoveitem = _.filter(items, {pid: object.pid, psid: object.psid});
                    if (needremoveitem.length > 0) {
                        items = _.without(items, needremoveitem[0]);
                    }
                });

                this.update(items);

                if (userId) {
                    var resource = $resource(config.domain + '/mobile/mergecar');
                    resource.save({userid: userId, items: items}, function () {

                    }, function (err) {
                        console.log(err);
                    });
                }

                $rootScope.$broadcast('removeCar',{});

            },
            addQuantity: function (cars, pid, psid, num) {

                var record = _.where(cars, {pid: pid, psid: psid});
                if (record.length > 0) {
                    record = record[0];
                }

                record.quantity += num;

                if (record) {
                    if (record.quantity > 99) {
                        record.quantity = 99;
                    }

                    else if (record.quantity < 1) {
                        record.quantity = 1;
                    }
                }
            },
            put: function (record) {
                var exists = this.find({pid: record.pid, psid: record.psid});
                if (exists) {
                    exists.quantity += record.quantity;
                } else {
                    items.push(record);
                }

                this.update(items);

                $rootScope.$broadcast('putCar',{});
            },
            merge: function (userId, remote) {
                var deferred = $q.defer();

                _.each(remote, function (r) {
                    var exists = _.where(items, {pid: r.pid, psid: r.psid});
                    if (exists.length <= 0) {
                        items.push(r);
                    }
                });

                var upload = function () {
                    var deferred = $q.defer(),
                        resource = $resource(config.domain + '/mobile/mergecar');

                    resource.save({userid: userId, items: items}, function () {
                        deferred.resolve(items);
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                };

                var save = function () {
                    var deferred = $q.defer();
                    window.localStorage['carItems'] = angular.toJson(items);
                    deferred.resolve(items);
                    return deferred.promise;
                }

                upload()
                    .then(this.fetch)
                    .then(save)
                    .then(function () {
                        deferred.resolve();
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                        console.log(error);
                    });

                return deferred.promise;
            },
            pay: function (items) {
                if (items) {
                    payItems = items;
                } else {
                    return payItems;
                }
            }
        }
    })

    /*
     *alipay支付服务
     */
    .factory('AliPay', function (Loading) {
        return {
            pay: function (url, orderid, $scope, $state) {
                var handler = window.open(url, '_blank', 'location=yes,hidden=yes');
                handler.addEventListener('loadstop', function () {
                    Loading.close();
                    handler.show();
                });
                handler.addEventListener('loadstart', function (event) {
                    if (event.url.match('/mobile/alipay_callback')) {
                        handler.close();
                    }
                });
                handler.addEventListener('exit', function () {
                    Loading.tip('订单已提交，感谢购买');
                    //$state.go('tab.orderdetail', {id: orderid});
                    $state.go('tab.account');
                });
                handler.addEventListener('loaderror', function () {
                    Loading.tip('本次支付失败');
                    $state.go('tab.orderdetail', {id: orderid});
                });
            },
            cz: function (url, $scope, $state) {
                var handler = window.open(url, '_blank', 'location=yes,hidden=yes');
                handler.addEventListener('loadstop', function () {
                    Loading.close();
                    handler.show();
                });
                handler.addEventListener('loadstart', function (event) {
                    if (event.url.match('/mobile/alipay_cz_callback')) {
                        handler.close();
                    }
                });
                handler.addEventListener('exit', function () {
                    Loading.tip('订单已提交，感谢购买');
                    $state.go('tab.account');
                });
                handler.addEventListener('loaderror', function () {
                    Loading.tip('本次支付失败');
                    $state.go('tab.account');
                });
            }
        }
    })

    /*
     *MyOrders支付服务
     */
    .factory('MyOrders', function ($resource) {
        var orders = [];

        var query = function (userId, index, size, type) {
            var params = {
                    index: index || 1,
                    size: size || 5,
                    userid: userId,
                    type: type || 'all'
                },
                resource = $resource(config.domain + '/mobile/order', {}, {query: {isArray: false}});

            return resource.query(params);
        };

        return {
            query: query,
            cancelOrder: function (id) {
                var exists = _.where(orders, {id: parseInt(id)});
                if (exists.length > 0) {
                    exists[0].status = '已取消';
                    exists[0].scolor = '';
                    exists[0].itemcolor = 'item-stable';
                }
            },
            allOrders: function (userId, index, size) {
                return query(userId, index, size, 'all');
            },
            unPayOrders: function () {
                return query(userId, index, size, 'unpay');
            },
            unWayOrders: function () {
                return query(userId, index, size, 'unway');
            },
            setOrders: function (items) {
                orders = items;
            }
        }
    })

    /*
     *MyAddress地址服务
     */
    .factory('MyAddress', function () {
        var streets = [{'K': '碑林区', 'V': ['南院门街道', '柏树林街道', '长乐坊街道', '东关南街街道', '太乙路街道', '文艺路街道', '长安路街道', '张家村街道']},
            {'K': '灞桥区', 'V': ['纺织城街道', '十里铺街道', '红旗街道', '席王街道', '洪庆街道', '狄寨街道', '灞桥街道', '新筑街道', '新合街道']},
            {
                'K': '长安区',
                'V': ['韦曲街道', '郭杜街道', '引镇街道', '王寺街道', '滦镇街道', '马王街道', '太乙宫街道', '东大街道', '子午街道', '斗门街道', '细柳街道', '杜曲街道', '大兆街道', '兴隆街道', '黄良街道']
            },
            {'K': '莲湖区', 'V': ['青年路街道', '北院门街道', '北关街道', '红庙坡街道', '环城西路街道', '西关街道', '土门街道', '桃园路街道', '枣园街道']},
            {'K': '未央区', 'V': ['张家堡街道', '三桥街道', '辛家庙街道', '徐家湾街道', '大明宫街道', '谭家街道', '草滩街道', '未央宫街道', '汉城街道', '六村堡街道']},
            {'K': '新城区', 'V': ['西一路街道', '长乐中路街道', '中山门街道', '韩森寨街道', '解放门街道', '自强路街道', '太华路街道', '长乐西路街道', '胡家庙街道']},
            {'K': '雁塔区', 'V': ['小寨路街道', '大雁塔街道', '长延堡街道', '电子城街道', '等驾坡街道', '鱼化寨街道', '丈八沟街道', '曲江街道']},

            {'K': '高新区', 'V': ['全部地区']}];
        return {
            newAddress: function (obj, addresses) {
                addresses.push(obj);
            },
            delAddress: function (id, $scope) {
                var exists = _.where($scope.$root.user.addresses, {id: parseInt(id)});
                if (exists.length > 0) {
                    $scope.$root.user.addresses = _.without($scope.$root.user.addresses, exists[0]);
                }
            },
            getDefaultAddress: function (addresses) {
                var exists = _.where(addresses, {isdefault: 1});
                if (exists.length > 0) {
                    return exists[0];
                }
                if (addresses.length > 0) {
                    return address[0];
                }
                return null;
            },
            updateAddress: function (obj, addresses) {
                var exists = _.where(addresses, {id: parseInt(obj.id)});
                if (exists.length > 0) {
                    exists[0].address = obj.address;
                    exists[0].province = obj.province;
                    exists[0].city = obj.city;
                    exists[0].mobile = obj.mobile;
                    exists[0].tel = obj.tel;
                    exists[0].name = obj.name;
                }
            },
            setDefaultAddress: function (id, addresses) {
                _.each(addresses, function (item) {
                    if (item.id == id) {
                        item.isdefault = 1;
                    }
                    else {
                        item.isdefault = 0;
                    }
                });
            },
            getAddressByID: function (id, addresses) {
                var exists = _.where(addresses, {id: parseInt(id)});
                if (exists.length > 0) {
                    return exists[0];
                }
                return null;
            },
            getCurrentStreets: function (region) {
                items = [];
                _.each(streets, function (item) {
                    if (item['K'] == region) {
                        items = item['V'];
                    }
                });
                return items;
            }
        }
    })

    .factory('Loading', function ($ionicLoading) {
        return {
            show: function (delay) {
                delay = delay || 1000;
                $ionicLoading.show({
                    delay: delay
                });
            },
            tip: function (message, duration) {
                duration = duration || 2000;
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: message,
                    duration: duration,
                    noBackdrop: true
                });
            },
            close: function () {
                $ionicLoading.hide();
            }
        }
    });



