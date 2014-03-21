class LogWatcher extends FSWatcher

  fileAdded:(change)->
    {name} = change.file
    [percentage, status] = name.split '-'
    @emit "UpdateProgress", percentage, status

domain     = "#{KD.nick()}.kd.io"
OutPath    = "/tmp/_bracketsinstaller.out"
kdbPath    = "~/.koding-brackets"
resource   = "https://gokmen.kd.io/apps/brackets.kdapp"

class BracketsInstaller extends KDView

  constructor:->
    super cssClass: "brackets-installer"

  viewAppended:->

    KD.singletons.appManager.require 'Terminal', =>

      @addSubView @header = new KDHeaderView
        title         : "Brackets Installer"
        type          : "big"

      @addSubView @toggle = new KDToggleButton
        cssClass        : 'toggle-button'
        style           : "clean-gray"
        defaultState    : "Show details"
        states          : [
          title         : "Show details"
          callback      : (cb)=>
            @terminal.setClass 'in'
            @toggle.setClass 'toggle'
            @terminal.webterm.setKeyView()
            cb?()
        ,
          title         : "Hide details"
          callback      : (cb)=>
            @terminal.unsetClass 'in'
            @toggle.unsetClass 'toggle'
            cb?()
        ]

      @addSubView @logo = new KDCustomHTMLView
        tagName       : 'img'
        cssClass      : 'logo'
        attributes    :
          src         : "#{resource}/bracketslogo.jpg"

      @watcher = new LogWatcher

      @addSubView @progress = new KDProgressBarView
        initial       : 100
        title         : "Checking installation..."

      @addSubView @terminal = new TerminalPane
        cssClass      : 'terminal'

      @addSubView @button = new KDButtonView
        title         : "Install Brackets"
        cssClass      : 'main-button solid'
        loader        : yes
        callback      : => @installCallback()

      @addSubView @link = new KDCustomHTMLView
        cssClass : 'hidden running-link'
        
      @link.setSession = (session)->
        @updatePartial "Click here to launch Brackets: <a target='_blank' href='http://#{domain}:3000/brackets/#{session}'>http://#{domain}:3000/brackets/#{session}</a>"
        @show()

      @addSubView @content = new KDCustomHTMLView
        cssClass : "brackets-help"
        partial  : """
          <p>This is an early version of Brackets, a code editor for HTML, CSS
          and JavaScript that's <em>built</em> in HTML, CSS and JavaScript. </p>
          
          <p>What makes Brackets different from other web code editors?</p>
          
          <ul>
            <li>
            <strong>Tools shouldn't get in your way.</strong> Instead of cluttering up your coding
            environment with lots of panels and icons, the Quick Edit UI in Brackets puts 
            context-specific code and tools inline.</li>
            <li>
            <strong>Brackets is in sync with your browser.</strong> With Live Preview, Brackets
            works directly with your browser to push code edits instantly and jump
            back and forth between your real source code and the browser view.</li>
            <li>
            <strong>Do it yourself.</strong> Because Brackets is open source, and built with HTML, CSS
            and JavaScript, you can <a href="https://github.com/adobe/brackets/blob/master/CONTRIBUTING.md">help build</a> the best code editor for the web.</li>
          </ul>
          
          <p>You can see some <a href="https://github.com/adobe/brackets/wiki/Brackets-Screenshots">screenshots of Brackets</a>
          on the wiki, <a href="http://www.youtube.com/user/CodeBrackets">intro videos</a> on YouTube, and news on the <a href="http://blog.brackets.io/">Brackets blog</a>.</p>
        """

      @checkState()

  checkState:->

    vmc = KD.getSingleton 'vmController'

    @button.showLoader()

    FSHelper.exists "~/.koding-brackets/brackets.js", vmc.defaultVmName, (err, brackets)=>
      warn err  if err
      
      unless brackets
        @link.hide()
        @progress.updateBar 100, '%', "Brackets is not installed."
        @switchState 'install'
      else
        @progress.updateBar 100, '%', "Checking for running instances..."
        @isBracketsRunning (session)=>
          if session
            message = "Brackets is running."
            @link.setSession session
            @switchState 'stop'
          else
            message = "Brackets is not running."
            @link.hide()
            @switchState 'run'
            if @_lastRequest is 'run'
              delete @_lastRequest

              modal = KDModalView.confirm
                title       : 'Failed to run Brackets'
                description : 'It might not have been installed to your VM or not configured properly.<br/>Do you want to re-install Brackets?'
                ok          :
                  title     : 'Re-Install'
                  style     : 'modal-clean-green'
                  callback  : =>
                    modal.destroy()
                    @switchState 'install'
                    @installCallback()
                    @button.showLoader()

          @progress.updateBar 100, '%', message
  
  switchState:(state = 'run')->

    @watcher.off 'UpdateProgress'

    switch state
      when 'run'
        title = "Run Brackets"
        style = 'green'
        @button.setCallback => @runCallback()
      when 'install'
        title = "Install Brackets"
        style = ''
        @button.setCallback => @installCallback()
      when 'stop'
        title = "Stop Brackets"
        style = 'red'
        @button.setCallback => @stopCallback()

    @button.unsetClass 'red green'
    @button.setClass style
    @button.setTitle title or "Run Brackets"
    @button.hideLoader()

  stopCallback:->
    @_lastRequest = 'stop'
    @terminal.runCommand "pkill -f '.koding-brackets/brackets.js' -u #{KD.nick()}"
    KD.utils.wait 3000, => @checkState()

  runCallback:->
    @_lastRequest = 'run'
    session = (Math.random() + 1).toString(36).substring 7
    @terminal.runCommand "node #{kdbPath}/brackets.js #{session} &"
    KD.utils.wait 3000, => @checkState()

  installCallback:->
    @watcher.on 'UpdateProgress', (percentage, status)=>
      @progress.updateBar percentage, '%', status
      if percentage is "100"
        @button.hideLoader()
        @toggle.setState 'Show details'
        @terminal.unsetClass 'in'
        @toggle.unsetClass 'toggle'
        @switchState 'run'
      else if percentage is "0"
        @toggle.setState 'Hide details'
        @terminal.setClass 'in'
        @toggle.setClass 'toggle'
        @terminal.webterm.setKeyView()

    session = (Math.random() + 1).toString(36).substring 7
    tmpOutPath = "#{OutPath}/#{session}"
    vmc = KD.getSingleton 'vmController'
    vmc.run "rm -rf #{OutPath}; mkdir -p #{tmpOutPath}", =>
      @watcher.stopWatching()
      @watcher.path = tmpOutPath
      @watcher.watch()
      @terminal.runCommand "curl --silent #{resource}/installer.sh | bash -s #{session}"

  isBracketsRunning:(callback)->
    vmc = KD.getSingleton 'vmController'
    vmc.run "pgrep -f '.koding-brackets/brackets.js' -l -u #{KD.nick()}", (err, res)->
      if err or res.exitStatus > 0 then callback false
      else callback res.stdout.split(' ').last

        
# -------------

class BracketsController extends AppController

  constructor:(options = {}, data)->
    options.view    = new BracketsInstaller
    options.appInfo =
      name : "Brackets"
      type : "application"

    super options, data

do ->

  # In live mode you can add your App view to window's appView
  if appView?

    view = new BracketsInstaller
    appView.addSubView view

  else

    KD.registerAppClass BracketsController,
      name     : "Brackets"
      routes   :
        "/:name?/Brackets" : null
        "/:name?/gokmen/Apps/Brackets" : null
      dockPath : "/gokmen/Apps/Brackets"
      behavior : "application"