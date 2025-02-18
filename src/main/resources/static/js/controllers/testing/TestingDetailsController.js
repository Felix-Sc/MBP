/* global app */

/**
 * Controller for the test details pages that can be used to extend more specific controllers with a default behaviour.
 */
app.controller('TestingDetailsController',
    ['$scope', '$controller', 'TestService', 'testingDetails', 'sensorList', '$rootScope', '$routeParams', '$interval', 'UnitService', 'NotificationService', '$http', 'HttpService', 'ENDPOINT_URI', 'ruleList',
        function ($scope, $controller, TestService, testingDetails, sensorList, $rootScope, $routeParams, $interval, UnitService, NotificationService, $http, HttpService, ENDPOINT_URI, ruleList) {
            //Initialization of variables that are used in the frontend by angular
            const vm = this;
            vm.ruleList = ruleList;
            vm.test = testingDetails;
            vm.executeRules = true;
            vm.sensorType = testingDetails.type;

            // ID of the Test
            const COMPONENT_ID = $routeParams.id;
            const RERUN_PREFIX = "RERUN_";
            const CONFIG_NAME_REAL_SENSOR = "ConfigRealSensors";
            // Constant list of the sensor simulators, that can be included in the test
            const SIMULATOR_LIST = ['TestingTemperatureSensor',
                'TestingTemperatureSensorPl',
                'TestingHumiditySensor',
                'TestingHumiditySensorPl',
                'TestingAccelerationSensor',
                'TestingAccelerationSensorPl',
                'TestingGPSSensor',
                'TestingGPSSensorPl'];



            // Storing variables
            vm.sensorListTest = [];
            vm.sensorListTestNames = [];
            vm.rules = [];
            vm.updateValues = [];
            vm.configUpdate = [];
            vm.rulesUpdate = [];
            vm.newTestObject = {};
            vm.newTestObject.config = [];
            vm.ruleNames = "";
            vm.actionNames = "";
            vm.deviceNames = "";


            /**
             * Initializing function, sets up basic things.
             */
            (function initController() {

                getPDFList();
                getTestRules();
                getConfig();
                disableReuse();
                getTestSensorList();
                // define the parameters of the real sensors included into the test
                getRealSensorList();


                //Refresh test select picker when the modal is opened
                $('.modal').on('shown.bs.modal', function () {
                    $('.selectpicker').selectpicker('refresh');
                });

            })();


            /**
             * [Private]
             *
             * creates a list of sensors depending on whether the test is in rerun mode or not.
             * If the test is in rerun mode, only the rerun sensors are added to the list. This list is then passed to the chart controller.
             */
            function getTestSensorList() {
                // Saves the name of all registered sensors included in the test into a list
                for (let sensor in sensorList) {
                    // Check if sensor is included in the test
                    if (testingDetails.type.indexOf(sensorList[sensor].name) !== -1) {
                        vm.sensorListTestNames.push(sensorList[sensor].name);
                    }
                }

                // Check if test is reusing data from the previous test
                if (testingDetails.useNewData === false) {
                    for (let sensorName in vm.sensorListTestNames) {
                        for (let sensor in sensorList) {
                            // If Test is in Rerun Mode only add the rerun sensors of the test to this list
                            if (sensorList[sensor].name === RERUN_PREFIX + vm.sensorListTestNames[sensorName]) {
                                vm.sensorListTest.push(sensorList[sensor]);
                            }
                        }
                    }
                } else {
                    for (let sensor in sensorList) {
                        if (testingDetails.type.indexOf(sensorList[sensor].name) !== -1) {
                            vm.sensorListTest.push(sensorList[sensor]);
                            vm.sensorListTestNames.push(sensorList[sensor].name);
                        }
                    }
                }

            }

            /**
             * [Public]
             *
             * Checks if a specific sensor included into the test is a real sensor
             * @param type of the sensor to be checked
             * @returns {boolean}
             */
            function checkSimulator(type) {
                return SIMULATOR_LIST.some(function (sensorType) {
                    return type === sensorType;

                });


            }

            /**
             * [Private]
             *
             * If no values have been generated for this test, the test cannot be repeated.
             * The corresponding button becomes Disabled.
             */
            function disableReuse() {
                if (testingDetails.simulationList === null) {
                    document.getElementById("ReuseSwitch").disabled = true;
                } else {
                    document.getElementById("ReuseSwitch").removeAttribute('disabled');
                }
            }

            /**
             * [Private]
             *
             *  Checks if real sensors are included into the test and saves them into a list
             */

            function getRealSensorList() {
                vm.selectedRealSensor = [];
                for (let y = 0; y < testingDetails.type.length; y++) {
                    if (!checkSimulator(testingDetails.type[y])) {
                        for (let z = 0; z < sensorList.length; z++) {
                            if (sensorList[z].name === testingDetails.type[y]) {
                                vm.selectedRealSensor.push(sensorList[z]);
                            }
                        }
                    }
                }
            }

            /**
             * [Private]
             *
             * Creates a server request to get all rules to be observed during the Test of the IoT-Application.
             * The names and actions of this rules will be formatted for the user view.
             */
            function getTestRules() {
                $scope.ruleList = TestService.getRuleListTest(COMPONENT_ID);

                for (let i = 0; i < testingDetails.rules.length; i++) {
                    if (i === 0) {
                        vm.ruleNames = vm.ruleNames + testingDetails.rules[i].name;
                        vm.actionNames = vm.actionNames + testingDetails.rules[i].actionNames;
                        console.log(vm.ruleNames, vm.actionNames)
                    } else {
                        vm.ruleNames = vm.ruleNames + ", " + testingDetails.rules[i].name;
                        for (let x = 0; x < testingDetails.rules[i].actionNames.length; x++) {
                            if (vm.actionNames.includes(testingDetails.rules[i].actionNames[x])) {

                            } else {
                                vm.actionNames = vm.actionNames + ", " + testingDetails.rules[i].actionNames[x];
                            }
                        }
                    }
                }

            }


            /**
             * [Public]
             *
             * Creates a server request to get a list of all generated Test Reports regarding to the Test of the IoT-Application.
             */
            function getPDFList() {
                vm.pdfDetails = [];
                TestService.getPDFList(COMPONENT_ID).then(function (response) {
                    $scope.pdfTable = response;
                });
            }

            /**
             * [Public]
             *
             * Sends a server request to open the test report of a specific test given by its id.
             */
            function downloadPDF(path) {
                window.open('api/test-details/downloadPDF/' + path, '_blank');
            }

            /**
             * [Public]
             *
             * Creates a server request to delete a certain Test Report for the specific Test
             */
            function deletePDF(pdfPath) {
                TestService.deleteTestReport(COMPONENT_ID, pdfPath.toString()).then(function (response) {
                    $scope.pdfTable = response;
                });
            }


            /**
             * [Public]
             *
             * Sends a server request in order to edit the configurations of the test "useNewData",
             * so that the latest values of a specific test are reused in the new execution or not
             *
             * @param useNewData boolean if the generated data should be reused
             */
            function editConfig(useNewData) {
                let useNewDataConfig;
                if (useNewData === true) {
                    useNewDataConfig = "false";
                } else if (useNewData === false) {
                    useNewDataConfig = "true";
                }

                TestService.editConfig(COMPONENT_ID, useNewDataConfig).then(function () {
                    window.location.reload();
                    getTestSensorList();
                });


            }


            /**
             * [Public]
             *
             * Sends a server request in order to update/edit the whole configurations of the test, if the user modifies the configuration via the edit Test Modal.
             */
            function updateTest() {
                vm.configUpdate = [];
                vm.rulesUpdate = [];

                // get updates to be integrated
                getUpdateValues();

                // save the new test configurations for performing the server Request
                testingDetails.config = [];
                testingDetails.config = vm.newTestObject.config;
                testingDetails.rules = vm.rulesUpdate;
                if (vm.executeRules === "true") {
                    testingDetails.triggerRules = true;
                } else if (vm.executeRules === "false") {
                    testingDetails.triggerRules = false;
                }

                // Server Request with the updated test information in the request body
                TestService.updateTest(COMPONENT_ID, testingDetails).then(function successCallback() {
                    //Close modal on success
                    $("#editTestModal").modal('toggle');
                    getConfig();
                });
            }


            /**
             * [Private]
             *
             * Gets all new configuration settings of the user from the edit test modal and puts them into the correct format.
             *
             */
            function getUpdateValues() {
                getRealSensorList();

                // Get the new list of selected rules for the test
                vm.rulesUpdate = $rootScope.selectedRules.rules;
                console.log(vm.rulesUpdate);

                if (vm.executeRules === 'undefined') {
                    NotificationService.notify('A decision must be made.', 'error')
                }

                vm.newTestObject = TestService.getTestData(testingDetails.type, vm.selectedRealSensor, vm.parameterVal, $rootScope.config, $rootScope.selectedRules.rules, ruleList, vm.executeRules);
            }

            /**
             * [Private]
             *
             * Get the Configuration of the test to display them on the edit Test Modal
             */
            function getConfig() {
                let eventTemp;
                let anomalyTemp;
                let roomTemp;
                let eventHum;
                let anomalyHum;
                let roomHum;
                let eventTempPl;
                let anomalyTempPl;
                let roomTempPl;
                let eventHumPl;
                let anomalyHumPl;
                let useNewData;
                let roomHumPl;

                let simTime;
                let amountEvents;
                let amountAnomalies;
                let eventGPS;
                let anomalyGPS;
                let whoGPS;
                let latitudeGPS;
                let longitudeGPS;
                let heightGPS;
                let reactionMetersGPS;

                let eventGPSPl;
                let anomalyGPSPl;
                let whoGPSPl;
                let latitudeGPSPl;
                let longitudeGPSPl;
                let heightGPSPl;
                let reactionMetersGPSPl;

                let eventAcc;
                let anomalyAcc;
                let weightObjectAcc;
                let sensitivityClassAcc;
                let reactionMetersAcc;

                let eventAccPl;
                let anomalyAccPl;
                let weightObjectAccPl;
                let sensitivityClassAccPl;
                let reactionMetersAccPl;

                vm.rules = [];
                vm.selectedRealSensor = [];
                $rootScope.config = {};
                $rootScope.selectedRealSensor = [];


                for (let y = 0; y < testingDetails.type.length; y++) {

                    if (!checkSimulator(testingDetails.type[y])) {
                        for (let z = 0; z < sensorList.length; z++) {
                            if (sensorList[z].name === testingDetails.type[y]) {
                                vm.selectedRealSensor.push(sensorList[z]);
                            }

                        }
                    }

                }
                $rootScope.selectedRealSensor = vm.selectedRealSensor;

                testingDetails.config.forEach(function (config) {
                    for (let n = 0; n < config.length; n++) {
                        if (config[n].name === "ConfigRealSensors") {
                            vm.parameterVal = angular.fromJson(config[n].value);
                        }
                    }

                });

                $scope.config.useNewData = !testingDetails.useNewData;

                testingDetails.config.forEach(function (config) {
                    config.forEach(function (parameterInstance) {
                        if (parameterInstance.name === "ConfigName") {
                            let configName = parameterInstance.value;
                            switch (configName) {
                                case 'TESTING_TemperatureSensor':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            if ((parameterInstance.name === "event" && parameterInstance.value === "3") || (parameterInstance.name === "event" && parameterInstance.value === "4") || (parameterInstance.name === "event" && parameterInstance.value === "5") || (parameterInstance.name === "event" && parameterInstance.value === "6")) {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventTemp = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyTemp = parameterInstance.value;
                                                    } else if (parameterInstance.name === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    }
                                                });

                                                $rootScope.config.eventTemp = eventTemp;
                                                $rootScope.config.anomalyTemp = anomalyTemp;
                                            } else {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventTemp = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyTemp = parameterInstance.value;
                                                    } else if (parameterInstance.name === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "room") {
                                                        roomTemp = parameterInstance.value;
                                                    }
                                                });

                                                $rootScope.config.eventTemp = eventTemp;
                                                $rootScope.config.anomalyTemp = anomalyTemp;
                                                $rootScope.config.roomTemp = roomTemp;

                                            }
                                        }
                                    });
                                    break;
                                case 'TESTING_HumiditySensor':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            if (parameterInstance.name === "event" && parameterInstance.value === '3' || parameterInstance.name === "event" && parameterInstance.value === '4' || parameterInstance.name === "event" && parameterInstance.value === '5' || parameterInstance.name === "event" && parameterInstance.value === '6') {

                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventHum = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyHum = parameterInstance.value;
                                                    } else if (parameterInstance.name === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    }
                                                });

                                                $rootScope.config.eventHum = eventHum;
                                                $rootScope.config.anomalyHum = anomalyHum;
                                            } else {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventHum = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyHum = parameterInstance.value;
                                                    } else if (parameterInstance.name === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "room") {
                                                        roomHum = parameterInstance.value;
                                                    }
                                                });
                                                $rootScope.config.eventHum = eventHum;
                                                $rootScope.config.anomalyHum = anomalyHum;
                                                $rootScope.config.roomHum = roomHum;
                                            }
                                        }
                                    });

                                    break;
                                case 'TESTING_TemperatureSensorPl':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            if (parameterInstance.name === "event" && parameterInstance.value === '3' || parameterInstance.name === "event" && parameterInstance.value === '4' || parameterInstance.name === "event" && parameterInstance.value === '5' || parameterInstance.name === "event" && parameterInstance.value === '6') {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventTempPl = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyTempPl = parameterInstance.value;
                                                    } else if (parameterInstance.name === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "simTime") {
                                                        simTime = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountEvents") {
                                                        amountEvents = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountAnomalies") {
                                                        amountAnomalies = parameterInstance.value;
                                                    }
                                                });


                                                $rootScope.config.eventTempPl = eventTempPl;
                                                $rootScope.config.anomalyTempPl = anomalyTempPl;
                                                $rootScope.config.simTime = simTime;
                                                $rootScope.config.amountEvents = amountEvents;
                                                $rootScope.config.amountAnomalies = amountAnomalies;

                                            } else {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventTempPl = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyTempPl = parameterInstance.value;
                                                    } else if (parameterInstance.value === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "simTime") {
                                                        simTime = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountEvents") {
                                                        amountEvents = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountAnomalies") {
                                                        amountAnomalies = parameterInstance.value;
                                                    } else if (parameterInstance.name === "room") {
                                                        roomTempPl = parameterInstance.value;
                                                    }
                                                });
                                                $rootScope.config.eventTempPl = eventTempPl;
                                                $rootScope.config.anomalyTempPl = anomalyTempPl;
                                                $rootScope.config.roomTempPl = roomTempPl;
                                                $rootScope.config.simTime = simTime;
                                                $rootScope.config.amountEvents = amountEvents;
                                                $rootScope.config.amountAnomalies = amountAnomalies;
                                            }
                                        }
                                    });


                                    break;
                                case 'TESTING_HumiditySensorPl':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            if (parameterInstance.name === "event" && parameterInstance.value === '3' || parameterInstance.name === "event" && parameterInstance.value === '4' || parameterInstance.name === "event" && parameterInstance.value === '5' || parameterInstance.name === "event" && parameterInstance.value === '6') {

                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventHumPl = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyHumPl = parameterInstance.value;
                                                    } else if (parameterInstance.value === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "simTime") {
                                                        simTime = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountEvents") {
                                                        amountEvents = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountAnomalies") {
                                                        amountAnomalies = parameterInstance.value;
                                                    }
                                                });
                                                $rootScope.config.eventHumPl = eventHumPl;
                                                $rootScope.config.anomalyHumPl = anomalyHumPl;
                                                $rootScope.config.simTime = simTime;
                                                $rootScope.config.amountEvents = amountEvents;
                                                $rootScope.config.amountAnomalies = amountAnomalies;

                                            } else {
                                                config.forEach(function (parameterInstance) {
                                                    if (parameterInstance.name === "event") {
                                                        eventHumPl = parameterInstance.value;
                                                    } else if (parameterInstance.name === "anomaly") {
                                                        anomalyHumPl = parameterInstance.value;
                                                    } else if (parameterInstance.value === "useNewData") {
                                                        useNewData = !parameterInstance.value;
                                                    } else if (parameterInstance.name === "simTime") {
                                                        simTime = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountEvents") {
                                                        amountEvents = parameterInstance.value;
                                                    } else if (parameterInstance.name === "amountAnomalies") {
                                                        amountAnomalies = parameterInstance.value;
                                                    } else if (parameterInstance.name === "room") {
                                                        roomHumPl = parameterInstance.value;
                                                    }
                                                });

                                                $rootScope.config.eventHumPl = eventHumPl;
                                                $rootScope.config.anomalyHumPl = anomalyHumPl;
                                                $rootScope.config.roomHumPl = roomHumPl;
                                                $rootScope.config.simTime = simTime;
                                                $rootScope.config.amountEvents = amountEvents;
                                                $rootScope.config.amountAnomalies = amountAnomalies;

                                            }
                                        }
                                    });


                                    break;
                                case 'TESTING_GPSSensor':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            if (parameterInstance.name === "event") {
                                                eventGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "anomaly") {
                                                anomalyGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "useNewData") {
                                                useNewData = !parameterInstance.value;
                                            } else if (parameterInstance.name === "latitude") {
                                                latitudeGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "longitude") {
                                                longitudeGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "height") {
                                                heightGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "who") {
                                                whoGPS = parameterInstance.value;
                                            } else if (parameterInstance.name === "reactionMeters") {
                                                reactionMetersGPS = parameterInstance.value;
                                            }
                                        }
                                    });


                                    $rootScope.config.eventGPS = eventGPS;
                                    $rootScope.config.anomalyGPS = anomalyGPS;
                                    $rootScope.config.latitudeGPS = latitudeGPS;
                                    $rootScope.config.longitudeGPS = longitudeGPS;
                                    $rootScope.config.hightGPS = heightGPS;
                                    $rootScope.config.whoGPS = whoGPS;
                                    $rootScope.config.reactionMetersGPS = reactionMetersGPS;

                                    break;
                                case 'TESTING_GPSSensorPl':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            eventGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "anomaly") {
                                            anomalyGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "useNewData") {
                                            useNewData = !parameterInstance.value;
                                        } else if (parameterInstance.name === "latitude") {
                                            latitudeGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "longitude") {
                                            longitudeGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "height") {
                                            heightGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "who") {
                                            whoGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "reactionMeters") {
                                            reactionMetersGPSPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "simTime") {
                                            simTime = parameterInstance.value;
                                        } else if (parameterInstance.name === "amountEvents") {
                                            amountEvents = parameterInstance.value;
                                        } else if (parameterInstance.name === "amountAnomalies") {
                                            amountAnomalies = parameterInstance.value;

                                        }

                                        $rootScope.config.eventGPS = eventGPS;
                                        $rootScope.config.anomalyGPS = anomalyGPS;
                                        $rootScope.config.latitudeGPS = latitudeGPS;
                                        $rootScope.config.longitudeGPS = longitudeGPS;
                                        $rootScope.config.hightGPS = heightGPS;
                                        $rootScope.config.whoGPS = whoGPS;
                                        $rootScope.config.reactionMetersGPS = reactionMetersGPS;
                                        $rootScope.config.simTime = simTime;
                                        $rootScope.config.amountEvents = amountEvents;
                                        $rootScope.config.amountAnomalies = amountAnomalies;

                                    });
                                    break;
                                case 'TESTING_AccelerationSensor':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            eventAcc = parameterInstance.value;
                                        } else if (parameterInstance.name === "anomaly") {
                                            anomalyAcc = parameterInstance.value;
                                        } else if (parameterInstance.name === "useNewData") {
                                            useNewData = !parameterInstance.value;
                                        } else if (parameterInstance.name === "weightObject") {
                                            weightObjectAcc = parameterInstance.value;
                                        } else if (parameterInstance.name === "sensitivityClass") {
                                            sensitivityClassAcc = parameterInstance.value;
                                        } else if (parameterInstance.name === "reactionMeters") {
                                            reactionMetersAcc = parameterInstance.value;
                                        }
                                    });
                                    $rootScope.config.eventAcc = eventAcc;
                                    $rootScope.config.anomalyAcc = anomalyAcc;
                                    $rootScope.config.reactionMetersAcc = reactionMetersAcc;
                                    $rootScope.config.weightObjectAcc = weightObjectAcc;
                                    $rootScope.config.sensitivityClassAcc = sensitivityClassAcc;

                                    break;
                                case 'TESTING_AccelerationSensorPl':
                                    config.forEach(function (parameterInstance) {
                                        if (parameterInstance.name === "event") {
                                            eventAccPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "anomaly") {
                                            anomalyAccPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "useNewData") {
                                            useNewData = !parameterInstance.value;
                                        } else if (parameterInstance.name === "weightObject") {
                                            weightObjectAccPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "sensitivityClass") {
                                            sensitivityClassAccPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "reactionMeters") {
                                            reactionMetersAccPl = parameterInstance.value;
                                        } else if (parameterInstance.name === "simTime") {
                                            simTime = parameterInstance.value;
                                        } else if (parameterInstance.name === "amountEvents") {
                                            amountEvents = parameterInstance.value;
                                        } else if (parameterInstance.name === "amountAnomalies") {
                                            amountAnomalies = parameterInstance.value;

                                        }

                                    });

                                    $rootScope.config.eventAccPl = eventAccPl;
                                    $rootScope.config.anomalyAccPl = anomalyAccPl;
                                    $rootScope.config.reactionMetersAccPl = reactionMetersAccPl;
                                    $rootScope.config.weightObjectAccPl = weightObjectAccPl;
                                    $rootScope.config.sensitivityClassAccPl = sensitivityClassAccPl;
                                    $rootScope.config.simTime = simTime;
                                    $rootScope.config.amountEvents = amountEvents;
                                    $rootScope.config.amountAnomalies = amountAnomalies;

                                    break;
                            }
                        }
                    });
                });


                for (let i = 0; i < testingDetails.rules.length; i++) {
                    ruleList.forEach(function (rule) {
                        if (rule.name === testingDetails.rules[i].name) {
                            vm.rules.push(rule);
                        }
                    });
                }
                $rootScope.selectedRules = {rules: vm.rules};

                if (testingDetails.triggerRules === true) {
                    vm.executeRules = "true";
                } else {
                    vm.executeRules = "false";
                }

            }

            //Extend the controller object for the public functions to make them available from outside
            angular.extend(vm, $controller('TestingChartController as testingChartCtrl',
                {
                    $scope: $scope,
                    testingDetails: testingDetails,
                    sensorList: vm.sensorListTest,
                    liveChartContainer: 'liveValues',
                    historicalChartContainer: 'historicalValues',
                    historicalChartSlider: 'historicalChartSlider'
                }), {
                updateTestCtrl: $controller('UpdateItemController as updateTestCtrl', {
                    $scope: $scope,
                    updateItem: updateTest
                }),
                downloadPDF: downloadPDF,
                getPDFList: getPDFList,
                editConfig: editConfig,
                editTestConfiguration: updateTest,
                deletePDF: deletePDF
            });
        }

    ]);

