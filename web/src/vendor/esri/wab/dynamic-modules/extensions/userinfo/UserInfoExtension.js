var cookie_storage_name = 'user_cookie_storage';

define(['dojo/_base/declare',
        'dojo/_base/array',
        'dojo/topic',
        'dojo/cookie',
        'dojo/Deferred',
        'esri/IdentityManager',
        'esri/arcgis/Portal'], function(declare,
                                        array,
                                        topic,
                                        cookie,
                                        Deferred,
                                        IdentityManager,
                                        Portal) {
  var
    instance = null,
    clazz = null,
    global = this;

  clazz = declare([], {

    constructor: function() {
      var json = JSON.parse(cookie(cookie_storage_name));
      IdentityManager.initialize(json);
      instance = this;
      this.extractGroupsFromLoggedUser();
    },
    extractGroupsFromLoggedUser: function() {
      instance.getLoggedPortalUser().then(function(portalUser){
        if(portalUser) {
          global.user = {
            'firstName': portalUser.firstName,
            'lastName': portalUser.lastName,
            'culture': portalUser.culture,
            'email': portalUser.email,
            'lastLogin': portalUser.lastLogin
          };
        }
      });
    },
    getLoggedPortalUser: function() {
      var def = new Deferred();

      IdentityManager.checkSignInStatus('http://imgcloud.maps.arcgis.com/').then (
        function () {
          var myPortal = new Portal.Portal('http://imgcloud.maps.arcgis.com/');
          myPortal.signIn().then(function(portalUser){
            def.resolve(portalUser);
          });
        },
        function (e) {
          def.reject(e);
        }
      );
      return def;
    }
  });

  instance = new clazz();
  return instance;
});
