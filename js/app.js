angular
    .module('userManager', [
        'ui.router',
        'angular-loading-bar',
        'mgcrea.ngStrap',
        'ngAnimate'
    ])
    .config(['$urlRouterProvider', '$stateProvider',
        function($urlRouterProvider, $stateProvider) {
            $urlRouterProvider.otherwise('/');

            $stateProvider
                .state('home', {
                    url: '/',
                    templateUrl: 'templates/home.html'
                })
                .state('map', {
                    url: '/map',
                    templateUrl: 'templates/map.html',
                    controller: 'map',
                    resolve: {
                        userList: ['$http', function($http) {
                            return $http.get('http://localhost:8080/user')
                                .then(function(data) {
                                    return data.data;
                                });
                        }]
                    }
                })
                .state('admin', {
                    url: '/admin',
                    controller: 'userList',
                    templateUrl: 'templates/admin.html',
                    abstract: true
                })
                .state('admin.addRegularUser', {
                    url: '/',
                    templateUrl: 'templates/regularForm.html',
                    controller: 'userForm'
                })
                .state('admin.addFullUser', {
                    url: '/full',
                    templateUrl: 'templates/fullForm.html',
                    controller: 'userForm'
                })
                .state('admin.addCustomUser', {
                    url: '/custom',
                    templateUrl: 'templates/customForm.html',
                    controller: 'userForm'
                })
        }
    ])
    .directive('contenteditable', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                elm.on('blur', function() {
                    scope.$apply(function() {
                        ctrl.$setViewValue(elm.html());
                    });
                });
                ctrl.$render = function() {
                    elm.html(ctrl.$viewValue);
                };

                ctrl.$render();
            }
        };
    })
    .controller('userList', ['$scope', '$http',
        function($scope, $http) {
            $http.get('http://localhost:8080/user') //Should used resolve instead here
                .success(function(data) {
                    $scope.users = data;
                });

            $scope.deleteUser = function(user, $index) {
                $http.delete('http://localhost:8080/user/' + user._id)
                    .success(function() {
                        $scope.users.splice($index, 1);
                    });
            }

            $scope.updateUser = function(user) {
                var obj = {};
                angular.extend(obj, user);
                delete obj._id;
                delete user.pass;
                $http.put('http://localhost:8080/user/' + user._id, obj);
                //Maybe show some feedback here
            }
        }
    ])
    .controller('userForm', ['$scope', '$http',
        function($scope, $http) {
            $scope.user = {customFields:[]};

            $scope.addUser = function() {
                if ($scope.user.custom)
                    $scope.user.custom = $scope.user.custom.replace(/(\r\n|\n|\r)/g,"<br />");
                if ($scope.user.address) {
                    $scope.getAddress($scope.user.address).then(function(res) {
                        if (res[0]) {
                            $scope.user.loc = {};
                            $scope.user.loc.type = 'Point';
                            $scope.user.loc.coordinates = [res[0].geometry.location.lat, res[0].geometry.location.lng];
                        }
                        postUser();
                    });
                }
                else
                    postUser();
            };

            function postUser() {
                $http.post('http://localhost:8080/user', $scope.user)
                    .success(function(data) {
                        angular.extend($scope.user, data);
                        delete $scope.user.pass;
                        $scope.$parent.users.push($scope.user);
                        $scope.user = {customFields:[]};
                    });
            }

            $scope.addFormGroup = function() {
                $scope.user.customFields.push({fieldName: 'Custom field', value: ''});
            }

            $scope.$watch('user.customFields', function(newValue, oldValue) {
                if (!$scope.user.customFields)
                    return;
                $scope.user.customFields = $scope.user.customFields.filter(function(item){
                    return item.fieldName !== '';
                });
            }, true);

            $scope.getAddress = function(viewValue) {
                var params = {address: viewValue, sensor: false};
                return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
                    .then(function(res) {
                        return res.data.results;
                    });
            };
        }
    ])
    //Unfinished
    .controller('map', ['$scope', 'userList', '$http',
        function($scope, userList, $http) {
            var map = L.map('map').setView([51.505, -0.09], 2);

            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            for (var i = 0; i < userList.length; ++i) {
                if (!userList[i].loc)
                    continue;
                L.marker(userList[i].loc.coordinates).addTo(map)
                    .bindPopup('Login: ' + userList[i].login + '<br> Address: ' + userList[i].address);
            }

            $scope.getCountry = function(viewValue) {
                var params = {name: viewValue};
                return $http.get('http://localhost:8080/country', {params: params})
                    .then(function(res) {
                        return res.data;
                    });
            };
        }
    ]);
