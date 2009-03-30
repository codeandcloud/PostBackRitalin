﻿var PostBackRitalin = function(waitText, waitImage, monitoredUpdatePanels, preload, waitClass) {
  this._waitText = waitText;
  this._waitImage = waitImage;
  this._waitClass = waitClass;

  this._monitoredUpdatePanels = monitoredUpdatePanels;

  this._preload = preload;

  this._pageRequestManager = null;
  this._beginRequestHandler = null;
  this._endRequestHandler = null;

  this._oldText = null;
  this._oldImage = null;
  this._oldHref = null;

  this._initialize();
}

PostBackRitalin.prototype = {
  _isMonitoredRequest: function(panelID) {
    if (this._monitoredUpdatePanels == null) {
      return true;
    }

    for (var i = 0; i < this._monitoredUpdatePanels.length; i++) {
      if (panelID.match(this._monitoredUpdatePanels[i].UpdatePanelID) != null) {
        return true;
      }
    }

    return false;
  },

  _isDisableAllElementsPanel: function(panelID) {
    if (this._monitoredUpdatePanels == null) {
      return false;
    }

    for (var i = 0; i < this._monitoredUpdatePanels.length; i++) {
      if (panelID.match(this._monitoredUpdatePanels[i].UpdatePanelID) != null) {
        return this._monitoredUpdatePanels[i].DisableAllElements;
      }
    }
  },

  get_waitText: function(panelID) {
    if (this._monitoredUpdatePanels) {
      for (var i = 0; i < this._monitoredUpdatePanels.length; i++) {
        if (panelID.match(this._monitoredUpdatePanels[i].UpdatePanelID) != null) {
          return this._monitoredUpdatePanels[i].WaitText;
        }
      }
    }

    if (this._waitText != null) {
      return this._waitText;
    }

    return null;
  },

  get_waitImage: function(panelID) {
    if (this._monitoredUpdatePanels) {
      for (var i = 0; i < this._monitoredUpdatePanels.length; i++) {
        if (panelID.match(this._monitoredUpdatePanels[i].UpdatePanelID) != null) {
          return this._monitoredUpdatePanels[i].WaitImage;
        }
      }
    }

    if (this._waitImage != null) {
      return this._waitImage;
    }

    return null;
  },

  _disableAllElements: function(panelID) {
    var panel = $get(panelID);

    if (panel != null) {
      var inputs = panel.getElementsByTagName('input');

      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'submit' || inputs[i].type == 'button' || inputs[i].type == 'image') {
          inputs[i].disabled = true;
        }
      }

      var anchors = panel.getElementsByTagName('a');

      for (var i = 0; i < anchors.length; i++) {
        if (anchors[i].href.match('javascript:__doPostBack') != null) {
          anchors[i].href = '#';

          if (this._waitClass != null) {
            Sys.UI.DomElement.addCssClass(anchors[i], this._waitClass);
          }
        }
      }
    }
  },

  _parseSendingPanel: function(SenderString) {
    // Grab just the sending UpdatePanel's ID.
    var tmp = SenderString.split('|')[0];

    // Replace any $ characters with underscores.
    tmp = tmp.replace(/\$/g, '_');

    return tmp;
  },

  _beginRequest: function(sender, args) {
    var sendingPanel = this._parseSendingPanel(sender._postBackSettings.panelID);
    var element = args.get_postBackElement();

    if (element != null && this._isMonitoredRequest(sendingPanel)) {
      if (element.type == 'submit' || element.type == 'button') {
        element.disabled = true;
        element.blur();

        this._oldText = element.value;

        var waitText = this.get_waitText(sendingPanel);

        if (waitText != null)
          element.value = waitText;
      }
      else if (element.type == 'image') {
        element.disabled = true;
        element.blur();

        this._oldImage = element.src;

        var waitImage = this.get_waitImage(sendingPanel);

        if (waitImage != null)
          element.src = waitImage;
      }
      else if (element.tagName == 'A') {
        this._oldHref = element.href;
        element.href = '#';
        element.blur();

        if (this._waitClass != null) {
          Sys.UI.DomElement.addCssClass(element, this._waitClass);
        }
      }

      if (this._isDisableAllElementsPanel(sendingPanel)) {
        this._disableAllElements(sendingPanel);
      }
    }
  },

  _endRequest: function(sender, args) {
    var element = sender._postBackSettings.sourceElement;
    var sendingPanel = this._parseSendingPanel(sender._postBackSettings.panelID);

    // Check to make sure the item hasn't been removed during the postback.
    if (element != null && this._isMonitoredRequest(sendingPanel)) {
      element.disabled = false;

      // Handles regular submit buttons.
      if (element.type == 'submit' || element.type == 'button') {
        element.value = this._oldText;
        this._oldText = null;
      }
      // Handles image buttons.
      else if (element.type == 'image') {
        element.src = this._oldImage;
        this._oldImage = null;
      }
      else if (element.tagName == 'A') {
        element.href = this._oldHref;
        this._oldHref = null;

        if (this._waitClass != null) {
          Sys.UI.DomElement.removeCssClass(element, this._waitClass);
        }
      }
    }
  },

  _initialize: function() {
    this._pageRequestManager = Sys.WebForms.PageRequestManager.getInstance();

    this._beginRequestHandler = Function.createDelegate(this, this._beginRequest);
    this._pageRequestManager.add_beginRequest(this._beginRequestHandler);

    this._endRequestHandler = Function.createDelegate(this, this._endRequest);
    this._pageRequestManager.add_endRequest(this._endRequestHandler);

    if (this._preload) {
      var image = new Image();

      // Preload the global WaitImage.
      if (this._waitImage != null) {
        image.src = this._waitImage;
      }

      // Preload each UpdatePanel specific image.
      for (var i = 0; i < this._monitoredUpdatePanels.length; i++) {
        if (this._monitoredUpdatePanels[i].WaitImage != null) {
          image.src = this._monitoredUpdatePanels[i].WaitImage;
        }
      }
    }
  }
};