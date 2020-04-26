/* global app */

/**
 * Controller for the environment models list page.
 */
app.controller('EnvModelListController',
    ['$scope', '$controller', '$interval', 'envModelList', 'addEnvModel', 'updateEnvModel', 'deleteEnvModel',
        'adapterList', 'deviceTypesList', 'EnvModelService', 'NotificationService',
        function ($scope, $controller, $interval, envModelList, addEnvModel, updateEnvModel, deleteEnvModel,
                  adapterList, deviceTypesList, EnvModelService, NotificationService) {
            //Get required DOM elements
            const MODEL_EDIT_ENVIRONMENT = $("#model-edit-card");

            //Save current scope
            let vm = this;

            //Whether the current model of the modelling tool has been changed and needs to be saved
            vm.saveNecessary = false;

            //Stores properties of the current model (name, description)
            vm.modelProperties = {name: "", description: ""};

            //Internal fields
            let modelSubscription = null; //Subscription to model events
            let isNewModel = true; //Whether the currently edited model is a new one
            let currentModelID = null; //The ID of the currently edited model or null if it is a new model
            let ignorePropertyUpdate = false; //True, if updates of model properties should be ignored for save indication

            /**
             * Initializing function, sets up basic things.
             */
            (function initController() {
                //Initialize
                $(document).ready(function () {
                    //Enable tooltips
                    $('[data-toggle="tooltip"]').tooltip({
                        delay: {"show": 500, "hide": 0}
                    }).on('click', function () {
                        //Hide tooltip in button click
                        $(this).tooltip("hide");
                    });
                });
            })();

            function saveNewModel(modelObject) {
                vm.addEnvModelCtrl.item = modelObject;
                vm.addEnvModelCtrl.addItem().then(function () {
                    //Check for success
                    if (vm.addEnvModelCtrl.success) {
                        //Success, switch from new to existing model
                        isNewModel = false;
                        currentModelID = vm.addEnvModelCtrl.result.id;
                    } else {
                        //Failure handling
                        //TODO
                        console.log(vm.addEnvModelCtrl.item.errors);

                    }
                });
            }

            function saveExistingModel(modelObject) {
                //Pass model object to controller
                vm.updateEnvModelCtrl.item = modelObject;

                //Pass model ID to the controller
                vm.updateEnvModelCtrl.item.id = currentModelID;

                //Create requeest for updating the model
                vm.updateEnvModelCtrl.updateItem().then(function (data) {
                    //Check for success
                    if (vm.updateEnvModelCtrl.success) {
                        console.log(data);
                        console.log(vm.updateEnvModelCtrl.result)
                    } else {
                        //Failure handling
                        //TODO
                        console.log(vm.updateEnvModelCtrl.item.errors);
                    }
                });
            }

            function subscribeModel(modelId) {
                //Close old subscription if existing
                if (modelSubscription != null) {
                    modelSubscription.close();
                }

                //Subscribe model
                modelSubscription = EnvModelService.subscribeModel(modelId, function (event) {
                    //Parse event data
                    let eventData = JSON.parse(event.data);

                    //Update node state
                    vm.envModelToolApi.updateNodeState(eventData.nodeId, 'registered');
                }, function (event) {

                }, function (event) {

                }, function (event) {

                }, function (event) {

                });
            }

            /**
             * [Public]
             * Called when the components of the current model are supposed to be registered.
             */
            function registerComponents() {

                $('.progress-bar').stop(true).width(0).animate({
                    width: "100%",
                }, 3 * 1000);

                //Perform request
                EnvModelService.registerComponents(currentModelID).then(function (response) {
                    //Success
                    NotificationService.notify("Component registration succeeded.", "success");
                    $('.progress-bar').stop(true).width(0);
                }, function (response) {
                    //Failure
                    NotificationService.notify("Component registration failed.", "error");
                    $('.progress-bar').stop(true).width(0);
                });
            }

            /**
             * [Public]
             * Called when the components of the current model are supposed to be deployed.
             */
            function deployComponents() {

            }


            /**
             * [Public]
             * Called when the components of the current model are supposed to be undeployed.
             */
            function undeployComponents() {

            }


            /**
             * [Public]
             * Called when the components of the current model are supposed to be started.
             */
            function startComponents() {

            }

            /**
             * [Public]
             * Called when the components of the current model are supposed to be stopped.
             */
            function stopComponents() {

            }

            /**
             * [Public]
             * Called, when the user wants to create a new model.
             */
            function createNewModel() {
                //Hide modelling tool with callback
                MODEL_EDIT_ENVIRONMENT.slideUp(400, function () {
                    //Load empty model so that the user may create a new one
                    vm.envModelToolApi.loadEmptyModel();

                    //Ignore properties update, since it is not done by the user
                    ignorePropertyUpdate = true;

                    //Set default model properties
                    vm.modelProperties = {
                        name: "Unnamed Model",
                        description: ""
                    };

                    //Set edit mode
                    isNewModel = true;
                    currentModelID = null;

                    //New model, so no save necessary
                    vm.saveNecessary = false;

                    //Show modelling tool again
                    MODEL_EDIT_ENVIRONMENT.slideDown();
                });
            }

            /**
             * [Public]
             * Called, when the user wants to edit a model of the model list.
             */
            function editModel(modelID) {
                //Will hold the model that is supposed to be edited
                let modelToEdit = null;

                //Iterate over all models in the model list to find the matching model
                for (let i = 0; i < envModelList.length; i++) {
                    //Check for matching ID
                    if (envModelList[i].id === modelID) {
                        //Model found
                        modelToEdit = envModelList[i];
                        break;
                    }
                }

                //Check if model could be found
                if (modelToEdit == null) {
                    return;
                }

                //Hide modelling tool with callback
                MODEL_EDIT_ENVIRONMENT.slideUp(400, function () {
                    //Ignore properties update, since it is not done by the user
                    ignorePropertyUpdate = true;

                    //Set model properties
                    vm.modelProperties = {
                        name: modelToEdit.name,
                        description: modelToEdit.description
                    };

                    //Set edit mode
                    isNewModel = false;
                    currentModelID = modelToEdit.id;

                    //New model, so no save necessary
                    vm.saveNecessary = false;

                    //Display modelling tool again
                    MODEL_EDIT_ENVIRONMENT.slideDown(400, function () {
                        //Load model to make it editable
                        vm.envModelToolApi.loadModel(modelToEdit.modelJSON);

                        //Subscribe to model
                        subscribeModel(modelToEdit.id);
                    });
                });
            }

            /**
             * [Public]
             * Called, when the user wants to save a model by clicking on the save button of the modelling tool
             * menu bar.
             */
            function saveModel() {
                //Get and parse model name and description
                let modelName = vm.modelProperties.name.trim() || "";
                let modelDescription = vm.modelProperties.description.trim() || "";

                //Export current model as JSON string
                let modelJSON = vm.envModelToolApi.getModelJSON();

                //Create object for the model
                let modelObject = {
                    name: modelName,
                    description: modelDescription,
                    modelJSON: modelJSON
                };

                //Check if the current model is a new model
                if (isNewModel) {
                    //New model, create it
                    saveNewModel(modelObject);
                } else {
                    //Existing model, update it
                    saveExistingModel(modelObject);
                }

                //Model was saved, no save necessary anymore
                vm.saveNecessary = false;
            }

            /**
             * [Public]
             * Callback that is triggered in case the current model of the environment modelling tool has changed.
             */
            function onModelChanged() {
                //Model has been changed and needs to be saved
                vm.saveNecessary = true;
            }

            /**
             * [Public]
             * Shows an alert that asks the user if he is sure that he wants to delete a certain environment model.
             *
             * @param data A data object that contains the id of the environment model that is supposed to be deleted
             * @returns A promise of the user's decision
             */
            function confirmDelete(data) {
                let envModelId = data.id;
                let envModelName = "";

                //Determines the environment model's name by checking the list
                for (let i = 0; i < envModelList.length; i++) {
                    if (envModelId === envModelList[i].id) {
                        envModelName = envModelList[i].name;
                        break;
                    }
                }

                //Show the alert to the user and return the resulting promise
                return Swal.fire({
                    title: 'Delete environment model',
                    type: 'warning',
                    html: "Are you sure you want to delete environment model \"" + envModelName + "\"?",
                    showCancelButton: true,
                    confirmButtonText: 'Delete',
                    confirmButtonClass: 'bg-red',
                    focusConfirm: false,
                    cancelButtonText: 'Cancel'
                });
            }

            //Expose controllers
            angular.extend(vm, {
                envModelListCtrl: $controller('ItemListController as envModelListCtrl', {
                    $scope: $scope,
                    list: envModelList
                }),
                addEnvModelCtrl: $controller('AddItemController as addEnvModelCtrl', {
                    $scope: $scope,
                    addItem: addEnvModel
                }),
                updateEnvModelCtrl: $controller('UpdateItemController as updateEnvModelCtrl', {
                    $scope: $scope,
                    updateItem: updateEnvModel
                }),
                deleteEnvModelCtrl: $controller('DeleteItemController as deleteEnvModelCtrl', {
                    $scope: $scope,
                    deleteItem: deleteEnvModel,
                    confirmDeletion: confirmDelete
                }),
                adapterList: adapterList,
                deviceTypesList: deviceTypesList,
                registerComponents: registerComponents,
                deployComponents: deployComponents,
                undeployComponents: undeployComponents,
                startComponents: startComponents,
                stopComponents: stopComponents,
                createNewModel: createNewModel,
                editModel: editModel,
                saveModel: saveModel,
                onModelChanged: onModelChanged
            });

            //Watch change of model properties and indicate necessary saving
            $scope.$watch(function () {
                //Value being watched
                return vm.modelProperties.name + vm.modelProperties.description;
            }, function () {
                //Callback on change; check if property update is supposed to be ignored
                if (ignorePropertyUpdate) {
                    //Update ignored, but take next one serious
                    ignorePropertyUpdate = false;
                } else {
                    //Do not ignore, indicate a necessary save
                    vm.saveNecessary = true;
                }
            });

            //Watch addition of environment models and add them to the list
            $scope.$watch(
                function () {
                    //Value being watched
                    return vm.addEnvModelCtrl.result;
                },
                function () {
                    //Callback
                    let envModel = vm.addEnvModelCtrl.result;

                    //Make sure the result is valid
                    if (envModel) {
                        //Add environment model to list
                        vm.envModelListCtrl.pushItem(envModel);
                    }
                }
            );

            //Watch update of environment models and update them in the list accordingly
            $scope.$watch(
                function () {
                    //Value being watched
                    return vm.updateEnvModelCtrl.result;
                },
                function () {
                    //Callback
                    let updatedModel = vm.updateEnvModelCtrl.result;
                    vm.envModelListCtrl.updateItem(updatedModel);
                }
            );

            //Watch deletion of environment models and remove them from the list
            $scope.$watch(
                function () {
                    //Value being watched
                    return vm.deleteEnvModelCtrl.result;
                },
                function () {
                    //Callback
                    let id = vm.deleteEnvModelCtrl.result;
                    vm.envModelListCtrl.removeItem(id);
                }
            );
        }
    ]);