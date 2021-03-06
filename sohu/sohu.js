
var monkey = {
  title: '',
  vid: '',
  plid: '',
  referer: '',
  jobs: 0,
  formats: {
    p1: '标清',
    p2: '高清',
    p3: '超清',
    p4: '原画质'
  },

  p1: {
    json: [],
    su: [],
    clipsURL: [],
    ip: '',
    vid: 0,
    reserveIp: [],
    videos: [],
    params: [],
  },

  p2: {
    json: [],
    su: [],
    vid: 0,
    clipsURL: [],
    ip: '',
    reserveIp: [],
    videos: [],
    params: [],
  },

  p3: {
    json: [],
    su: [],
    clipsURL: [],
    vid: 0,
    ip: '',
    reserveIp: [],
    videos: [],
    params: [],
  },

  p4: {
    json: [],
    su: [],
    clipsURL: [],
    vid: 0,
    ip: '',
    reserveIp: [],
    videos: [],
    params: [],
  },

  run: function() {
    log('run() --');
    this.router();
  },

  router: function() {
    log('router() -- ');
    var host = uw.document.location.hostname;
    if (host === 'my.tv.sohu.com') {
      this.getUGCId();
    } else if (host === 'tv.sohu.com') {
      this.getId();
    } else {
      error('Error: this page is not supported');
    }
  },

  /**
   * Get video id for UGC video
   */
  getUGCId: function() {
    log('getUGCId() -- ');
    var scripts = uw.document.querySelectorAll('script'),
        script,
        vidReg = /var vid\s+=\s+'(\d+)'/,
        vidMatch,
        titleReg = /,title:\s+'([^']+)'/,
        titleMatch,
        txt,
        i;

    for (i = 0; script = scripts[i]; i += 1) {
      if (script.innerHTML.search('var vid') > -1) {
        txt = script.innerHTML;
        vidMatch = vidReg.exec(txt);
        log('vidMatch: ', vidMatch);
        if (vidMatch && vidMatch.length === 2) {
          this.vid = vidMatch[1];
        }
        log('titleMatch: ', titleMatch);
        titleMatch = titleReg.exec(txt);
        if (titleMatch && titleMatch.length === 2) {
          this.title = titleMatch[1];
        }
        break;
      }
    }
    if (this.vid.length > 0) {
      this.referer = uw.escape(uw.location.href);
      this.p2.vid = this.vid;
      this.getUGCVideoJSON('p2');
    } else {
      error('Error: failed to get video id!');
    }
  },

  /**
   * Get UGC video info
   */
  getUGCVideoJSON: function(fmt) {
    log('getUGCVideoJSON() -- ');
    var that = this,
        url = 'http://my.tv.sohu.com/videinfo.jhtml?m=viewtv&vid=' + this.vid;

    log('url: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response: ', response);
        var json = JSON.parse(response.responseText);

        log('json: ', json);
        that[fmt].json = json;
        that[fmt].su = json.data.su;
        that[fmt].clipsURL = json.data.clipsURL;

        if (fmt === 'p2') {
          if (json.data.norVid) {
            that.p1.vid = json.data.norVid;
            that.getUGCVideoJSON('p1');
          }
          if (json.data.superVid) {
            that.p3.vid = json.data.superVid;
            that.getUGCVideoJSON('p3');
          }
          if (json.data.oriVid) {
            that.p4.vid = json.data.oriVid;
            that.getUGCVideoJSON('p4');
          }
        }
        that.decUGCVideo(fmt);
      },
    });
  },

  /**
   * Decode UGC video url
   */
  decUGCVideo: function(fmt) {
    log('decUGCVideo() -- ');
    var url,
        json = this[fmt].json,
        i;

    for (i = 0; i < json.data.clipsURL.length; i += 1) {
      url = [
        'http://',
        json.allot,
        '?prot=',
        json.prot, 
        '&file=',
        json.data.clipsURL[i],
        '&new=',
        json.data.su[i],
      ].join('');
      log('url: ', url);
      this[fmt].videos.push('');
      this.jobs += 1;
      this.decUGCVideo2(fmt, url, i);
    }
  },

  decUGCVideo2: function(fmt, url, i) {
    log('decUGCVideo2() -- ');
    var that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response:', response);
        var params = response.responseText.split('|');

        that[fmt].params = params;
        that[fmt].videos[i] = [
          params[0],
          that[fmt].su[i],
          '?key=',
          params[3],
        ].join('');
        
        that.jobs -= 1;
        if (that.jobs === 0) {
          that.createUI();
        }
      },
    });
  },

  /**
   * Get video id
   */
  getId: function() {
    log('getId() --');
    this.vid = uw.vid;
    this.p2.vid = uw.vid;
    this.plid = uw.playlistId;
    this.title = uw.document.title.split('-')[0].trim();
    this.referer = uw.escape(uw.location.href);
    this.jobs += 1;
    this.getVideoJSON('p2');
  },

  /**
   * Get video info.
   * e.g. http://hot.vrs.sohu.com/vrs_flash.action?vid=1109268&plid=5028903&referer=http%3A//tv.sohu.com/20130426/n374150509.shtml
   */
  getVideoJSON: function(fmt) {
    log('getVideoJSON() --');
    log('fmt: ', fmt);
    var pref = 'http://hot.vrs.sohu.com/vrs_flash.action',
        url = '',
        that = this;

    // If vid is unset, just return it.
    if (this[fmt].vid === 0) {
      return;
    }

    url = [
      pref, 
      '?vid=', this[fmt].vid,
      '&plid=', this.plid,
      '&out=0',
      '&g=8',
      '&referer=', this.referer,
      '&r=1',
      ].join('');
    log('url: ', url);

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response: ', response);
        var i = 0;

        log(that);
        that.jobs -= 1;
        that[fmt].json = JSON.parse(response.responseText);
        //that.title = that[fmt].json.data.tvName;
        that[fmt].clipsURL = that[fmt].json.data.clipsURL;
        that[fmt].su = that[fmt].json.data.su;
        that.p1.vid = that[fmt].json.data.norVid;
        that.p2.vid = that[fmt].json.data.highVid;
        that.p3.vid = that[fmt].json.data.superVid;
        that.p4.vid = that[fmt].json.data.oriVid;
        that[fmt].ip = that[fmt].json.allot;
        that[fmt].reserveIp = that[fmt].json.reserveIp.split(';');
        for (i in that[fmt].clipsURL) {
          url = [
            'http://', that[fmt].ip,
            '/?prot=', that[fmt].clipsURL[i],
            '&new=', that[fmt].su[i],
            ].join('');
          that[fmt].videos.push(url);
        }

        if (fmt === 'p2') {
          if (that.p1.vid > 0) {
            that.jobs += 1;
            that.getVideoJSON('p1');
          }
          if (that.p3.vid > 0) {
            that.jobs += 1;
            that.getVideoJSON('p3');
          }
          if (that.p4.vid > 0) {
            that.jobs += 1;
            that.getVideoJSON('p4');
          }
        }

        // Display UI when all processes ended
        if (that.jobs === 0) {
          that.createUI();
        }
      },
    });
  },

  /**
   * Construct UI widgets
   */
  createUI: function() {
    log('createUI() --');
    log(this);
    var videos = {
          title: this.title,
          links: [],
          formats: [],
        },
        type,
        i;

    for (type in this.formats) {
      log('type: ', type);
      if (this[type].videos.length > 0) {
        videos.links.push(this[type].videos);
        videos.formats.push(this.formats[type]);
      }
    }
    if (videos.formats.length > 0) {
      multiFiles.run(videos);
    }
  },
};

monkey.run();

