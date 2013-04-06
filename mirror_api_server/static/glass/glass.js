(function (global) {
  "use strict";
  var doc = global.document, console = global.console, demoCards, templates;

  demoCards = {
    "items": [
      {
        "text": "Also works with Data-URIs!",
        "image": "https://lh5.googleusercontent.com/-L7PvYS3WeJQ/TvqB-VcRklI/AAAAAAAAP9U/eEBCbBNS9bY/s1012/IMG_0135-2.jpg",
        "cardOptions": [{"action": "SHARE"}, {"action": "REPLY"}],
        "when": "2013-04-05T12:36:52.755260",
        "id": 1
      },
      {
        "text": "Hello World!",
        "cardOptions": [{"action": "SHARE"}, {"action": "REPLY"}],
        "when": "2013-04-05T12:26:55.837450",
        "id": 2
      },
      {
        "text": "What a nice photo!",
        "image": "http://farm5.staticflickr.com/4122/4784220578_2ce8d9fac3_b.jpg",
        "cardOptions": [{"action": "SHARE"}, {"action": "REPLY"}],
        "when": "2013-04-05T11:32:19.603850",
        "id": 3
      }
    ]
  };

  templates = {
    "start": "<div class=\"card_interface\"></div>",
    "normal": "<div class=\"card_text\"></div><div class=\"card_date\"></div><div class=\"card_interface\"></div>",
    "action": "<div class=\"card_text\"></div><div class=\"card_interface\"></div>"
  };


  Date.prototype.niceDate = function () {
    var y, m, d, h, min, dif, now;
    now = new Date();
    dif = (now.getTime() - this.getTime()) / 1000 / 60;

    if (dif <= 1) { return "Just now"; }
    if (Math.round(dif) === 1) { return "a minute ago"; }
    if (dif < 60) { return Math.round(dif) + " minutes ago"; }

    dif = Math.round(dif / 60);
    if (dif === 1) { return "an hour ago"; }
    if (dif <= 4) { return dif + " hours ago"; }

    y = this.getFullYear().toString();
    m = (this.getMonth() + 1).toString();
    d = this.getDate().toString();
    h = this.getHours().toString();
    min = this.getMinutes().toString();

    if (this.getFullYear() === now.getFullYear() && this.getMonth() === now.getMonth() && this.getDate() === now.getDate()) {
      return (h[1] ? h : "0" + h[0]) + ":" + (min[1] ? min : "0" + min[0]);
    }
    return y + "-" + (m[1] ? m : "0" + m[0]) + "-" + (d[1] ? d : "0" + d[0]) + " " + (h[1] ? h : "0" + h[0]) + ":" + (min[1] ? min : "0" + min[0]);
  };

  Date.prototype.formatTime = function () {
    var h, min;

    h = this.getHours().toString();
    min = this.getMinutes().toString();

    return h + ":" + (min[1] ? min : "0" + min[0]);
  };

  function Glass() {
    var
      startCard,
      mirror,
      mainDiv = doc.getElementById("glass"),
      timer, running = false,
      CONTENT_CARD = 1,
      START_CARD = 2,
      CLOCK_CARD = 3,
      UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4;

    if (!global.glassDemoMode) {
      mirror = global.gapi.client.mirror;
    }

    function cardSort(a, b) {
      if (a.type === START_CARD) { return -1; }
      if (b.type === START_CARD) { return 1; }
      if (a.type === CLOCK_CARD) { return -1; }
      if (b.type === CLOCK_CARD) { return 1; }
      return b.date.getTime() - a.date.getTime();
    }

    function getClickDirection(x, y) {
      if (x < 30) { return RIGHT; }
      if (x > 610) { return LEFT; }
      if (y < 30) { return DOWN; }
      if (y > 330) { return UP; }
      return UP;
    }

    function getDirection(x1, y1, x2, y2) {
      var tmp, dx, dy;
      dx = x2 - x1;
      dy = y2 - y1;
      if (dx * dx + dy * dy < 3000) {
        // move too short
        return getClickDirection(x2, y2);
      }

      if (dx === 0) {
        return (dy > 0) ? DOWN : UP;
      }
      if (dy === 0) {
        return (dx > 0) ? RIGHT : LEFT;
      }
      tmp = Math.abs(dx / dy);
      if (tmp >= 0.5 && tmp <= 1.5) {
        // direction too diagonal, not distinct enough
        return getClickDirection(x2, y2);
      }

      if (tmp > 1.5) {
        // mainly horizontal movement
        return (dx > 0) ? RIGHT : LEFT;
      }

      // mainly vertical movement
      return (dy > 0) ? DOWN : UP;
    }

    function Card(type, id, parent, text, date, image) {
      var cardDiv, textDiv, dateDiv, interfaceDiv, mouseX, mouseY, ignoreClick = false, that = this, cards = [];
      this.id = id;
      this.text = text || "";
      this.type = type;
      if (date) {
        this.date = new Date(date);
      } else {
        this.date = new Date();
      }
      this.image = image;
      type = type || CONTENT_CARD;

      this.cardCount = function () {
        return cards.length;
      };

      this.showCard = function (pos) {
        cards[pos].show();
      };

      function loadImage() {
        cardDiv.style.backgroundImage = "url(" + that.image + ")";
      }

      function up() {
        if (cards && cards.length > 0) {
          cards[0].show();
          if (type === START_CARD) { that.hide(); }
        }
      }

      function down() {
        if (!!parent) {
          that.hide();
          parent.show();
        }
      }

      function left() {
        var pos;
        if (!!parent) {
          pos = parent.findPosition(that.id);
          if (pos < parent.cardCount() - 1) {
            that.hide();
            parent.showCard(pos + 1);
          }
        }
      }

      function right() {
        var pos;
        if (!!parent) {
          pos = parent.findPosition(that.id);
          if (pos > 0) {
            that.hide();
            parent.showCard(pos - 1);
          }
        }
      }

      function onMouseDown(e) {
        mouseX = e.pageX - cardDiv.offsetLeft;
        mouseY = e.pageY - cardDiv.offsetTop;
      }

      function onTouchStart(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
          e.preventDefault();
          mouseX = e.changedTouches[0].pageX - cardDiv.offsetLeft;
          mouseY = e.changedTouches[0].pageY - cardDiv.offsetTop;
        }
      }

      function makeMove(x1, y1, x2, y2) {
        var dir;
        dir = getDirection(x1, y1, x2, y2);

        switch (dir) {
        case RIGHT:
          right();
          break;
        case LEFT:
          left();
          break;
        case UP:
          up();
          break;
        case DOWN:
          down();
          break;
        }
      }

      function onTouchEnd(e) {
        var x, y;
        if (e.changedTouches && e.changedTouches.length > 0) {
          e.preventDefault();
          x = e.changedTouches[0].pageX - cardDiv.offsetLeft;
          y = e.changedTouches[0].pageY - cardDiv.offsetTop;
          makeMove(mouseX, mouseY, x, y);
        }
      }

      function onMouseUp(e) {
        var x, y;
        if (e.which !== 2 && e.button !== 2) {
          x = e.pageX - cardDiv.offsetLeft;
          y = e.pageY - cardDiv.offsetTop;

          makeMove(mouseX, mouseY, x, y);
        }
      }

      this.show = function () {
        cardDiv.style.display = "block";
        this.updateCardStyle();
      };

      this.hide = function () {
        cardDiv.style.display = "none";
      };

      function setupEvents() {
        if (global.ontouchstart !== undefined) {
          interfaceDiv.addEventListener("touchstart", onTouchStart, false);
          interfaceDiv.addEventListener("touchend", onTouchEnd, false);
        } else {
          interfaceDiv.onmousedown = onMouseDown;
          interfaceDiv.onmouseup = onMouseUp;
        }
        cardDiv.onselectstart = function () { return false; };
      }

      this.createDiv = function () {
        var tmpDiv;
        switch (type) {
        case CONTENT_CARD:
          cardDiv = doc.createElement("div");
          cardDiv.id = "c" + id;
          cardDiv.innerHTML = templates.normal;
          mainDiv.appendChild(cardDiv);
          textDiv = doc.querySelector("#" + cardDiv.id + " .card_text");
          textDiv.appendChild(doc.createTextNode(this.text));
          dateDiv = doc.querySelector("#" + cardDiv.id + " .card_date");
          dateDiv.appendChild(doc.createTextNode(this.date.niceDate()));
          if (this.image) {
            loadImage();
          }
          break;
        case START_CARD:
          cardDiv = doc.createElement("div");
          cardDiv.id = "c" + id;
          cardDiv.innerHTML = templates.start;
          mainDiv.appendChild(cardDiv);
          break;
        case CLOCK_CARD:
          cardDiv = doc.createElement("div");
          cardDiv.id = "c" + id;
          cardDiv.innerHTML = templates.normal;
          mainDiv.appendChild(cardDiv);
          textDiv = doc.querySelector("#" + cardDiv.id + " .card_text");
          textDiv.appendChild(doc.createTextNode("\"ok glass\""));
          dateDiv = doc.querySelector("#" + cardDiv.id + " .card_date");
          dateDiv.appendChild(doc.createTextNode((new Date()).formatTime()));
          break;
        }

        interfaceDiv = doc.querySelector("#" + cardDiv.id + " .card_interface");
        this.updateCardStyle();
        setupEvents();
        this.hide();
      };

      this.updateText = function (text) {
        if (this.text !== text) {
          this.text = text || "";
          textDiv.innerHTML = "";
          textDiv.appendChild(doc.createTextNode(this.text));
          return true;
        }
        return false;
      };

      this.updateDate = function (date) {
        var tmpDate = new Date(date);
        if (this.date.getTime() !== tmpDate.getTime()) {
          this.date = tmpDate;
          this.updateDisplayDate();
          return true;
        }
        return false;
      };

      this.updateImage = function (image) {
        if (this.image !== image) {
          if (image) {
            this.image = image;
            loadImage();
          } else {
            this.image = undefined;
            cardDiv.style.backgroundImage = "none";
          }
          this.updateCardStyle();
        }
      };

      this.updateDisplayDate = function () {
        var i, l;
        switch (type) {
        case START_CARD:
          return;
        case CLOCK_CARD:
          dateDiv.innerHTML = "";
          dateDiv.appendChild(doc.createTextNode((new Date()).formatTime()));
          break;
        case CONTENT_CARD:
          dateDiv.innerHTML = "";
          dateDiv.appendChild(doc.createTextNode(this.date.niceDate()));
          break;
        }
        l = cards.length;
        for (i = 0; i < l; i++) {
          cards[i].updateDisplayDate();
        }
      };

      this.updateCardStyle = function () {
        var shadow = "", pos, last;
        cardDiv.className = "card";

        if (cards && cards.length > 0) {
          shadow += "_down";
        }

        if (!!parent) {
          pos = parent.findPosition(this.id);
          last = parent.cardCount() - 1;
          if (pos > 0) {
            shadow += "_left";
          }
          if (pos < last) {
            shadow += "_right";
          }
          shadow += "_up";
        }

        if (shadow !== "") {
          cardDiv.classList.add("shadow" + shadow);
        }
        switch (type) {
        case START_CARD:
          break;
        case CLOCK_CARD:
          cardDiv.classList.add("card_type_clock");
          break;
        case CONTENT_CARD:
          if (!!this.image) {
            cardDiv.classList.add("card_type_image");
          } else {
            cardDiv.classList.add("card_type_text");
            // And in the future possibly also card_type_html
          }
          break;
        }
      };

      this.getDiv = function () { return cardDiv; };

      this.findCard = function (id) {
        var i, l;
        l = cards.length;
        for (i = 0; i < l; i++) {
          if (cards[i].id === id) {
            return cards[i];
          }
        }
        return undefined;
      };

      this.findPosition = function (id) {
        var i, l;
        cards.sort(cardSort);
        l = cards.length;
        for (i = 0; i < l; i++) {
          if (cards[i].id === id) {
            return i;
          }
        }
      };

      this.addCard = function (card) {
        cards.push(card);
      };
    }

    function handleCards(result) {
      var i, l, card, cardDiv;
      if (result && result.items) {
        l = result.items.length;
        for (i = 0; i < l; i++) {
          card = startCard.findCard(result.items[i].id);
          if (card) {
            card.updateText(result.items[i].text);
            card.updateDate(result.items[i].when);
            card.updateImage(result.items[i].image);
            card.updateCardStyle();
          } else {
            card = new Card(CONTENT_CARD, result.items[i].id, startCard, result.items[i].text, result.items[i].when, result.items[i].image);
            card.createDiv();
            startCard.addCard(card);
          }
        }
      }
      startCard.updateDisplayDate();
    }


    function fetchCards() {
      timer = undefined;
      mirror.timeline.list().execute(function (result) {
        handleCards(result);
        timer = global.setTimeout(fetchCards, 30000);
      });
    }

    this.stop = function () {
      if (timer) {
        global.clearTimeout(timer);
        timer = undefined;
      }
      running = false;
    };

    this.start = function () {
      if (running || global.glassDemoMode) { return; }
      timer = global.setTimeout(fetchCards, 1);
      running = true;
    };

    function initialize() {
      var card;

      mainDiv.innerHTML = "";

      startCard = new Card(START_CARD, "start");
      startCard.createDiv();

      card = new Card(CLOCK_CARD, "clock", startCard);
      card.createDiv();
      startCard.addCard(card);

      if (global.glassDemoMode) {
        handleCards(demoCards);
      }

      startCard.show();
    }

    initialize();
  }

  global.onSignInCallback = function (authResult) {
    if (authResult.access_token) {
      global.gapi.client.load("mirror", "v1", function () {
        doc.getElementById("signin").style.display = "none";
        doc.getElementById("signout").style.display = "block";
        doc.getElementById("glass").style.display = "block";
        global.glassapp = global.glassapp || new Glass();
        global.glassapp.start();
      }, global.discoveryUrl);
    } else if (authResult.error) {
      console.log("There was an error: " + authResult.error);
      doc.getElementById("signin").style.display = "block";
      doc.getElementById("signout").style.display = "none";
      doc.getElementById("glass").style.display = "none";
    }
  };

  global.disconnectCallback = function (data) {
    console.log(data);
  };

  global.onload = function () {
    if (global.glassDemoMode) {
      global.glassapp = global.glassapp || new Glass();
      return;
    }
    doc.getElementById("signout_button").onclick = function () {
      var script, token;
      if (global.glassapp) { global.glassapp.stop(); }
      doc.getElementById("signin").style.display = "block";
      doc.getElementById("signout").style.display = "none";
      doc.getElementById("glass").style.display = "none";

      token = global.gapi.auth.getToken();
      if (token && token.access_token) {
        script = doc.createElement("script");
        script.src = "https://accounts.google.com/o/oauth2/revoke?token=" + token.access_token + "&callback=disconnectCallback";
        doc.head.appendChild(script);
      }
    };
  };
}(this));