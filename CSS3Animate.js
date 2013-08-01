var CSS3Animate = (function (window) {
    var ua = /Chrome|Firefox|IE|Safari|Opera/.exec(window.navigator.userAgent);
    var perfix = {
        'Chrome' : '-webkit-',
        'Safari' : '-webkit-',
        'Firefox' : '-moz-',
        'IE' : '-ms-',
        'Opera' : '-o-' }[ua] || '';

        
    var easingTable = { 
        //https://github.com/louisremi/jquery.transition.js
        linear:         "linear",
        ease:           "ease",
        swing:          "ease-out",
        bounce:         "cubic-bezier(0,.35,.5,1.3)",
        // Penner equation approximations from Matthew Lein's Ceaser: http://matthewlein.com/ceaser/
        easeInQuad:     "cubic-bezier(.55,.085,.68,.53)",
        easeInCubic:    "cubic-bezier(.55,.055,.675,.19)",
        easeInQuart:    "cubic-bezier(.895,.03,.685,.22)",
        easeInQuint:    "cubic-bezier(.755,.05,.855,.06)",
        easeInSine:     "cubic-bezier(.47,0,.745,.715)",
        easeInExpo:     "cubic-bezier(.95,.05,.795,.035)",
        easeInCirc:     "cubic-bezier(.6,.04,.98,.335)",
        easeOutQuad:    "cubic-bezier(.25,.46,.45,.94)",
        easeOutCubic:   "cubic-bezier(.215,.61,.355,1)",
        easeOutQuart:   "cubic-bezier(.165,.84,.44,1)",
        easeOutQuint:   "cubic-bezier(.23,1,.32,1)",
        easeOutSine:    "cubic-bezier(.39,.575,.565,1)",
        easeOutExpo:    "cubic-bezier(.19,1,.22,1)",
        easeOutCirc:    "cubic-bezier(.075,.82,.165,1)",
        easeInOutQuad:  "cubic-bezier(.455,.03,.515,.955)",
        easeInOutCubic: "cubic-bezier(.645,.045,.355,1)",
        easeInOutQuart: "cubic-bezier(.77,0,.175,1)",
        easeInOutQuint: "cubic-bezier(.86,0,.07,1)",
        easeInOutSine:  "cubic-bezier(.445,.05,.55,.95)",
        easeInOutExpo:  "cubic-bezier(1,0,0,1)",
        easeInOutCirc:  "cubic-bezier(.785,.135,.15,.86)"
    };

    function decodeTransform( str ) {
        var transform = {
            translate: [0,0,0],
            rotate: [0,0,0],
            scale: [1,1,1],
            skew: [0,0],
            perspective: 0
        };
        if(!str) return transform;
        var match, patten, i;

        patten = /(translate|rotate|scale|skew|perspective)(3d|X|Y|Z)?\(\s*?([0-9pxdeg\.%]+?)\s*?(?:,\s*?([0-9pxdeg\.%]+?))?(?:,\s*?([0-9pxdeg\.%]+?))?\s*?\)/gi;
        while(match = patten.exec(str)) {
            switch(match[2]) {
                case '3d': 
                    transform[match[1]] = removeUnit(match.slice(3));
                    break;
                case 'X':
                    transform[match[1]][0] = parseInt(match[3]);
                    break;
                case 'Y':
                    transform[match[1]][1] = parseInt(match[3]);
                    break;
                case 'Z':
                    transform[match[1]][2] = parseInt(match[3]);
                    break;
                default:
                    transform[match[1]] = match.length > 4 ? removeUnit(match.slice(3)) : parseInt(match[3]);

            }
        }
        return transform;
    }

    function removeUnit( arr ) {
        for( var i = 0; i < arr.length; i++ )
            if ( arr[i] ) arr[i] = parseInt(arr[i]);
        return arr;
    }

    function addUnit( arr, unit ) {
        for( var i = 0; i < arr.length; i++ )
            if( arr[i] ) arr[i] += unit;
        return arr;
    }

    function encodeTransform( transform ) {
        var parts = [];
        var alixs  = ['X', 'Y', 'Z'], i;
        var t = transform.translate,
            r = transform.rotate,
            s = transform.scale,
            k = transform.skew,
            p = transform.perspective;

        addUnit(t, 'px');
        addUnit(r, 'deg');
        addUnit(k, 'px');
        addUnit(p, 'px');
        for(i = 0; i < alixs.length; i++) {
            t[i] && parts.push('translate' + alixs[i] + '(' + t[i] + ')');
            r[i] && parts.push('rotate' + alixs[i] + '(' + r[i] + ')');
            k[i] && parts.push('skew' + alixs[i] + '(' + k[i] + ')');
            s[i] !== undefined && s[i] !== 1 && parts.push('scale' + alixs[i] + '(' + s[i] + ')');
        }
        if( s instanceof Array == false ) {
            parts.push('scale(' + s + ')');
        }
        if( p ) {
            parts.push('perspective(' + p + ')');
        }
        return parts.join(' ');
    }

    function mapStyles( dom, styles ) {
        var transform = decodeTransform( dom.style.getPropertyValue( perfix + 'transform' ) );
        var names = ['translate', 'rotate', 'scale', 'skew', 'perspective'],
            alixs  = ['X', 'Y', 'Z'];
        var i, j, name;
        for(i = 0; i < names.length; i++) {
            name = names[i];

            if(styles[name] !== undefined) {
                transform[name] = styles[name];
                delete styles[name];
            } 

            else {
                for(j = 0; j < alixs.length; j++) {
                    if( styles[name + alixs[j]] !== undefined ) {
                        transform[name][j] = styles[name + alixs[j]];
                        delete styles[name + alixs[j]];
                    }
                }
            }
        }
        styles[perfix + 'transform'] = encodeTransform(transform);
    }

    function setStyles( dom, styles ) {
        for( var name in styles ) {
            dom.style[name] = styles[name];
        }
    }

    function setTransition( dom, styles, duration, ease, delay ) {
        duration = duration || '300ms';
        styles = styles || 'all';
        ease = ease || 'ease';
        delay = delay || 0;
        dom.style[perfix + 'transition'] = [styles, duration, delay, ease].join(' ');
    }

    function removeTransition( dom ) {
        setTimeout(function(){
            dom.style.removeProperty( perfix + 'transition' );
        }, 50);
    }

    function classMotify( dom, rules ) {
        var i, sign, rule;
        rules = rules.split(' ');
        for(i = 0; i < rules.length; i++) {
            rule = rules[i];
            sign = rule.charAt(0);
            switch (sign) {
                case '-':
                    dom.classList.remove(rule.substr(1));
                    break;
                case '+':
                    dom.classList.add(rule.substr(1));
                    break;
                default:
                    dom.classList.add(rule);
            }
        }
    }

    function clone( obj ) {
        var copy = {};
        for(var p in obj)
            if( obj.hasOwnProperty(p) ) copy[p] = obj[p];
        return copy;
    }

    function doAnimate( dom, styles, duration, callback ) {
        if(typeof(duration) == 'function') {
            callback = duration;
            duration = 300;
        }
        duration = duration || 300;
        setTransition( dom, 'all', duration + 'ms');
        if ( typeof(styles) == 'string' ) {
            classMotify( dom, styles );
        }
        else {
            styles = clone(styles);
            mapStyles( dom, styles );
            setStyles( dom, styles );
        }
        setTimeout( function() {
            typeof(callback) == 'function' && callback.apply(dom);
        }, duration);

        clearTimeout(dom.transition_remove_timeout);
        dom.transition_remove_timeout = setTimeout( function(){            
            removeTransition( dom );
        }, duration * 1.2);
    }

    HTMLElement.prototype.animate = function(styles, duration, callback) {
        doAnimate(this, styles, duration, callback);
        return this;
    };

    HTMLElement.prototype.css = function( styles ) {
        if ( typeof(styles) == 'string' && arguments.length == 2 ) {
            var name = styles;
            styles = {};
            styles[name] = arguments[1];
        }
        var copy = clone(styles);
        mapStyles(this, copy);
        setStyles(this, copy);
    };
    var extend = {
        cssAnimate: function ( styles, duration, callback ) {
            var length = this.length, called = 0, that = this;
            function checkCall() {
                if( ++called == length ) callback.apply( that );
            }
            for(var i = 0; i < length; i++) {
                doAnimate( this[i], styles, duration, callback ? checkCall : undefined );
            }
            return this;
        }
    };
    if ( window.baidu ) {
        window.baidu.dom.extend( extend );
        baidu.dom.extend({
            css3: function ( styles ) {
                for(var i = 0; i < this.length; ++i) {
                    var copy = clone(styles);
                    mapStyles(this[i], copy);
                    baidu(this[i]).css( copy );
                }
                return this;
            }
        });
    }
})(window);