// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.

define([
  './extensions/userinfo/UserInfoExtension',
  'jimu/ConfigManager'
], function(userInfo, ConfigManager){
    var appname = (function () {
      // get appname in hash, if not found, redirect to root path
      if(window.location.hash) {
        var hash    = window.location.hash.substr(1).toLowerCase();
        var allowed = ['servicoscidadao', 'minharua', 'acoesmunicipio'];
        for (app in allowed) {
          if (hash === allowed[app]) {
            return hash;
          }
        }
      }
      window.location.href = window.location.protocol + '//' + window.location.host;
    }());
    ConfigManager.getInstance({
      config: [ 'appconf/', appname, '.json'].join('')
    });
});
