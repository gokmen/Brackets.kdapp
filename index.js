/* Compiled by kdc on Sat Mar 22 2014 02:33:43 GMT+0000 (UTC) */
(function() {
/* KDAPP STARTS */
/* BLOCK STARTS: /home/gokmen/Applications/Brackets.kdapp/index.coffee */
var BracketsController, BracketsInstaller, LogWatcher, OutPath, domain, kdbPath, resource, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

LogWatcher = (function(_super) {
  __extends(LogWatcher, _super);

  function LogWatcher() {
    _ref = LogWatcher.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  LogWatcher.prototype.fileAdded = function(change) {
    var name, percentage, status, _ref1;
    name = change.file.name;
    _ref1 = name.split('-'), percentage = _ref1[0], status = _ref1[1];
    return this.emit("UpdateProgress", percentage, status);
  };

  return LogWatcher;

})(FSWatcher);

domain = "" + (KD.nick()) + ".kd.io";

OutPath = "/tmp/_bracketsinstaller.out";

kdbPath = "~/.koding-brackets";

resource = "https://gokmen.kd.io/apps/brackets.kdapp";

BracketsInstaller = (function(_super) {
  __extends(BracketsInstaller, _super);

  function BracketsInstaller() {
    BracketsInstaller.__super__.constructor.call(this, {
      cssClass: "brackets-installer"
    });
  }

  BracketsInstaller.prototype.viewAppended = function() {
    var _this = this;
    return KD.singletons.appManager.require('Terminal', function() {
      _this.addSubView(_this.header = new KDHeaderView({
        title: "Brackets Installer",
        type: "big"
      }));
      _this.addSubView(_this.toggle = new KDToggleButton({
        cssClass: 'toggle-button',
        style: "clean-gray",
        defaultState: "Show details",
        states: [
          {
            title: "Show details",
            callback: function(cb) {
              _this.terminal.setClass('in');
              _this.toggle.setClass('toggle');
              _this.terminal.webterm.setKeyView();
              return typeof cb === "function" ? cb() : void 0;
            }
          }, {
            title: "Hide details",
            callback: function(cb) {
              _this.terminal.unsetClass('in');
              _this.toggle.unsetClass('toggle');
              return typeof cb === "function" ? cb() : void 0;
            }
          }
        ]
      }));
      _this.addSubView(_this.logo = new KDCustomHTMLView({
        tagName: 'img',
        cssClass: 'logo',
        attributes: {
          src: "" + resource + "/bracketslogo.jpg"
        }
      }));
      _this.watcher = new LogWatcher;
      _this.addSubView(_this.progress = new KDProgressBarView({
        initial: 100,
        title: "Checking installation..."
      }));
      _this.addSubView(_this.terminal = new TerminalPane({
        cssClass: 'terminal'
      }));
      _this.addSubView(_this.button = new KDButtonView({
        title: "Install Brackets",
        cssClass: 'main-button solid',
        loader: true,
        callback: function() {
          return _this.installCallback();
        }
      }));
      _this.addSubView(_this.link = new KDCustomHTMLView({
        cssClass: 'hidden running-link'
      }));
      _this.link.setSession = function(session) {
        this.updatePartial("Click here to launch Brackets: <a target='_blank' href='http://" + domain + ":3000/brackets/" + session + "'>http://" + domain + ":3000/brackets/" + session + "</a>");
        return this.show();
      };
      _this.addSubView(_this.content = new KDCustomHTMLView({
        cssClass: "brackets-help",
        partial: "<p>This is an early version of Brackets, a code editor for HTML, CSS\nand JavaScript that's <em>built</em> in HTML, CSS and JavaScript. </p>\n\n<p>What makes Brackets different from other web code editors?</p>\n\n<ul>\n  <li>\n  <strong>Tools shouldn't get in your way.</strong> Instead of cluttering up your coding\n  environment with lots of panels and icons, the Quick Edit UI in Brackets puts \n  context-specific code and tools inline.</li>\n  <li>\n  <strong>Brackets is in sync with your browser.</strong> With Live Preview, Brackets\n  works directly with your browser to push code edits instantly and jump\n  back and forth between your real source code and the browser view.</li>\n  <li>\n  <strong>Do it yourself.</strong> Because Brackets is open source, and built with HTML, CSS\n  and JavaScript, you can <a href=\"https://github.com/adobe/brackets/blob/master/CONTRIBUTING.md\">help build</a> the best code editor for the web.</li>\n</ul>\n\n<p>You can see some <a href=\"https://github.com/adobe/brackets/wiki/Brackets-Screenshots\">screenshots of Brackets</a>\non the wiki, <a href=\"http://www.youtube.com/user/CodeBrackets\">intro videos</a> on YouTube, and news on the <a href=\"http://blog.brackets.io/\">Brackets blog</a>.</p>"
      }));
      return _this.checkState();
    });
  };

  BracketsInstaller.prototype.checkState = function() {
    var vmc,
      _this = this;
    vmc = KD.getSingleton('vmController');
    this.button.showLoader();
    return FSHelper.exists("~/.koding-brackets/brackets.js", vmc.defaultVmName, function(err, brackets) {
      if (err) {
        warn(err);
      }
      if (!brackets) {
        _this.link.hide();
        _this.progress.updateBar(100, '%', "Brackets is not installed.");
        return _this.switchState('install');
      } else {
        _this.progress.updateBar(100, '%', "Checking for running instances...");
        return _this.isBracketsRunning(function(session) {
          var message, modal;
          if (session) {
            message = "Brackets is running.";
            _this.link.setSession(session);
            _this.switchState('stop');
          } else {
            message = "Brackets is not running.";
            _this.link.hide();
            _this.switchState('run');
            if (_this._lastRequest === 'run') {
              delete _this._lastRequest;
              modal = KDModalView.confirm({
                title: 'Failed to run Brackets',
                description: 'It might not have been installed to your VM or not configured properly.<br/>Do you want to re-install Brackets?',
                ok: {
                  title: 'Re-Install',
                  style: 'modal-clean-green',
                  callback: function() {
                    modal.destroy();
                    _this.switchState('install');
                    _this.installCallback();
                    return _this.button.showLoader();
                  }
                }
              });
            }
          }
          return _this.progress.updateBar(100, '%', message);
        });
      }
    });
  };

  BracketsInstaller.prototype.switchState = function(state) {
    var style, title,
      _this = this;
    if (state == null) {
      state = 'run';
    }
    this.watcher.off('UpdateProgress');
    switch (state) {
      case 'run':
        title = "Run Brackets";
        style = 'green';
        this.button.setCallback(function() {
          return _this.runCallback();
        });
        break;
      case 'install':
        title = "Install Brackets";
        style = '';
        this.button.setCallback(function() {
          return _this.installCallback();
        });
        break;
      case 'stop':
        title = "Stop Brackets";
        style = 'red';
        this.button.setCallback(function() {
          return _this.stopCallback();
        });
    }
    this.button.unsetClass('red green');
    this.button.setClass(style);
    this.button.setTitle(title || "Run Brackets");
    return this.button.hideLoader();
  };

  BracketsInstaller.prototype.stopCallback = function() {
    var _this = this;
    this._lastRequest = 'stop';
    this.terminal.runCommand("pkill -f '.koding-brackets/brackets.js' -u " + (KD.nick()));
    return KD.utils.wait(3000, function() {
      return _this.checkState();
    });
  };

  BracketsInstaller.prototype.runCallback = function() {
    var session,
      _this = this;
    this._lastRequest = 'run';
    session = (Math.random() + 1).toString(36).substring(7);
    this.terminal.runCommand("node " + kdbPath + "/brackets.js " + session + " &");
    return KD.utils.wait(3000, function() {
      return _this.checkState();
    });
  };

  BracketsInstaller.prototype.installCallback = function() {
    var session, tmpOutPath, vmc,
      _this = this;
    this.watcher.on('UpdateProgress', function(percentage, status) {
      _this.progress.updateBar(percentage, '%', status);
      if (percentage === "100") {
        _this.button.hideLoader();
        _this.toggle.setState('Show details');
        _this.terminal.unsetClass('in');
        _this.toggle.unsetClass('toggle');
        return _this.switchState('run');
      } else if (percentage === "0") {
        _this.toggle.setState('Hide details');
        _this.terminal.setClass('in');
        _this.toggle.setClass('toggle');
        return _this.terminal.webterm.setKeyView();
      }
    });
    session = (Math.random() + 1).toString(36).substring(7);
    tmpOutPath = "" + OutPath + "/" + session;
    vmc = KD.getSingleton('vmController');
    return vmc.run("rm -rf " + OutPath + "; mkdir -p " + tmpOutPath, function() {
      _this.watcher.stopWatching();
      _this.watcher.path = tmpOutPath;
      _this.watcher.watch();
      return _this.terminal.runCommand("curl --silent " + resource + "/installer.sh | bash -s " + session);
    });
  };

  BracketsInstaller.prototype.isBracketsRunning = function(callback) {
    var vmc;
    vmc = KD.getSingleton('vmController');
    return vmc.run("pgrep -f '.koding-brackets/brackets.js' -l -u " + (KD.nick()), function(err, res) {
      if (err || res.exitStatus > 0) {
        return callback(false);
      } else {
        return callback(res.stdout.split(' ').last);
      }
    });
  };

  return BracketsInstaller;

})(KDView);

BracketsController = (function(_super) {
  __extends(BracketsController, _super);

  function BracketsController(options, data) {
    if (options == null) {
      options = {};
    }
    options.view = new BracketsInstaller;
    options.appInfo = {
      name: "Brackets",
      type: "application"
    };
    BracketsController.__super__.constructor.call(this, options, data);
  }

  return BracketsController;

})(AppController);

(function() {
  var view;
  if (typeof appView !== "undefined" && appView !== null) {
    view = new BracketsInstaller;
    return appView.addSubView(view);
  } else {
    return KD.registerAppClass(BracketsController, {
      name: "Brackets",
      routes: {
        "/:name?/Brackets": null,
        "/:name?/gokmen/Apps/Brackets": null
      },
      dockPath: "/gokmen/Apps/Brackets",
      behavior: "application"
    });
  }
})();

/* KDAPP ENDS */
}).call();