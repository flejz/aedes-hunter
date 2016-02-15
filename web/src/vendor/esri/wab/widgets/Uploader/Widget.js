define([
        'dijit/Tooltip',
        'dojo/_base/declare',
        'dojo/_base/html',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/dom',
        'dojo/dom-construct',
        'dojo/request/iframe',
        'dojo/on',

        'jimu/BaseWidget',
        'jimu/dijit/Popup',
        'jimu/dijit/_FeaturelayerSourcePopup',
        'jimu/dijit/LoadingShelter',
        'dijit/form/ValidationTextBox',
        'dojox/form/Uploader',
        'dojo/domReady!'
        ],

    function(
        Tooltip,
        declare,
        html,
        _WidgetsInTemplateMixin,
        lang,
        array,
        dom,
        domConstruct,
        iframe,
        on,
        BaseWidget,
        Popup,
        _FeaturelayerSourcePopup) {

          global = this;

        /**
         * Message auxiliar function
         * @param  {string|object} msg  the message. string or object from dom-construct
         * @param  {json}          btns buttons array, if null ok button shows
         * @return {null}
         */
        function _msg(msg, btns) {
            btns = !btns ? [{
                label: 'OK',
                disable: false
            }] : btns;
            new Popup({
                titleLabel: 'Atenção!',
                content: domConstruct.toDom('<div>' + msg + '</div>'),
                width: 470,
                height: 270,
                buttons: btns
            });
        }

        // vars
        var _self,
            _optionsTable,
            _selectOperation,
            _selectIdentifier,
            _uplInit,
            _extractResponse;

        // Widget declaration
        return declare([BaseWidget, _WidgetsInTemplateMixin], {

            baseClass: 'uploader',

            /**
             * Post Create Override Method
             * @return {[type]} [description]
             */
            postCreate: function() {
                _self = this;
                _self.inherited(arguments);
            },

            startup: function() {
                _self.inherited(arguments);
                _optionsTable = dojo.byId('upload-options');
                _selectOperation = dojo.byId('upl-selectOperation');
                _selectIdentifier = dojo.byId('upl-identifier');
                _uplInit = dojo.byId('upl-init');

                // connect Tooltip
                new Tooltip({
                  connectId: ["idFieldHelp"],
                  label: [ 'Para as operações de Atualização de Dados, é necessário escolher um campo identificador.',
                           'Somente os registros com mesmo valor do campo identificador serão atualizados. ',
                           'O campo identificador não pode conter valores duplicados.' ].join('<br>')
                });

                // set events for select operations
                [ dojo.byId('upl-load'), dojo.byId('upl-update') ].forEach(function(element) {
                  on(element, 'change', function (event) {
                    _self.operationType = this.id == 'upl-load' ? 'Insert' : 'Update';
                    // if operation is update, an identifier must be chosen.
                    _selectIdentifier.style.display = _self.operationType == 'Insert' ? 'none' : '';
                  });
                });
            },

            _populateFields: function(headers) {

                if (!_extractResponse) return;

                var options = [],
                    header;

                // for each headers
                for (var i in _extractResponse.headers) {
                    header = _extractResponse.headers[i];

                    options.push({
                        label: header,
                        value: header
                    });
                }

                // sets the options to the identifier
                this.idField.set('options', options);
            },

            _reset: function() {
                dojo.byId('upl-load').checked = true;

                _optionsTable.style.display = 'none';
                _selectOperation.style.display = 'none';
                _selectIdentifier.style.display = 'none';
                _uplInit.style.display = 'none';

                _extractResponse = null;

                _self.shapefilePath.set('value', '');
                _self.idField.set('value', '');
                _self.sourceUrl.set('value', '');

                // loading ...
                _self.shelter.hide();
            },

            _showOptions: function() {
                _optionsTable.style.display = 'block';
            },

            _onChangeShapefile: function(evt) {
                console.log(evt);
                var src = evt.srcElement.value;

                _self._reset();
                _self.shapefilePath.set('value', src);
            },

            _onSelectShapefile: function() {
                dom.byId('uploadInput').click();
            },

            _onProcessShapefile: function() {

                if (!_self.shapefilePath.get('value')) {
                    _msg('Selecione um arquivo');
                    return;
                }

                // loading ...
                _self.shelter.show();

                // encapsule the form in an iframe wrapper to send as a post request
                var request = iframe.post("extract", {
                    form: dom.byId("uploadForm"),
                    handleAs: "json"
                }).then(function(response) {
                    console.log(response);
                    // defines the response to the cache
                    _extractResponse = response;

                    // populates the fields and show de options
                    _self._populateFields();
                    _self._showOptions();

                    // loading ...
                    _self.shelter.hide();

                }, function(err) {

                    // loading ...
                    _self.shelter.hide();

                    var msg = 'Problema ao processar o aquivo selecionado.<br/>' + err;
                    _msg(msg);
                    throw new Error(msg);
                });
            },

            /**
             * Event: set feature layer source click
             */
            _onSelectSourceClick: function() {

                // arguments definition from the featurelayersourcepopup
                var args = {

                    titleLabel: this.nls.setLayerSource,

                    dijitArgs: {
                        multiple: false,
                        createMapResponse: this.map.webMapResponse,
                        portalUrl: this.appConfig.portalUrl,
                        style: {
                            height: '100%'
                        }
                    }
                };

                var featurePopup = new _FeaturelayerSourcePopup(args);

                // on ok click at the end of the selection process
                on.once(featurePopup, 'ok', function(item) {

                    featurePopup.close();
                    window._f = item;

                    _selectOperation.style.display = '';
                    _uplInit.style.display = '';

                    console.log(item);
                    _self.sourceUrl.set('value', item.url);

                }, true);

                // on cancel click
                on.once(featurePopup, 'cancel', function() {
                    featurePopup.close();
                    featurePopup = null;
                });
            },

            _onConfirmClick: function() {

                var msg = '';

                // validation
                if (!_extractResponse)
                    msg = 'Selecione e processe um arquivo shapefile';
                else if (!_self.sourceUrl.get('value'))
                    msg = 'Selecione a camada';
                else if (_self.operationType === 'Update' && !_self.idField.get('value'))
                    msg = 'Selecione o campo id';

                if (msg)
                    _msg(msg);
                else {
                    // loading ...
                    _self.shelter.show();

                    if (!global.user) {
                      _self.shelter.hide();
                      return _msg('Não autorizado.');
                    }

                    // creates the post data and send post request
                    var postData = {
                            idField: _self.idField.get('value'),
                            layer: _self.sourceUrl.get('value'),
                            path: _extractResponse.file,
                            email: global.user.email,
                            operation: _self.operationType || 'Insert'
                        };
                    console.log(postData);
                        // post request
                    var deferred = dojo.xhrPost({
                            url: "confirm",
                            postData: postData,
                            load: function(data) {
                                console.log(data);
                                _self._reset();

                                dom.byId('uploadInput').value = '';
                                // TODO(alex): refactor this
                                _self.operationType = 'Insert';

                                _msg('Dados enviados. Aguarde processamento.');
                            },
                            error: function(error) {

                                _self._reset();
                                var msg = 'Problemas ao realizar a confirmação dos dados';
                                _msg(msg);
                                throw new Error(msg);
                            }
                        });

                    }

            },

            onClose: function() {
                _extractResponse = null;
                _optionsTable = null;
            }

        });

    });
