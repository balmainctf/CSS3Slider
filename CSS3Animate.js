/**
 * CSS3Animate
 *
 * @author  techird
 *
 *
 * 开始一个 CSS3 动画，如果存在正在进行的动画，则会直接从当前状态开始动画
 * CSS3Animate.start( dom, prop [, speed] [, ease] [, callback] );
 * 
 * 结束当前动画
 * CSS3Animate.stop( dom )
 *
 * 设置 css3 属性，自动加上浏览器前缀
 * CSS3Animate.css( dom )
 */
var CSS3Animate = (function (window) {

    // tools
    function trim( s ) { return s.replace(/\s/g, ''); }
    function map( arr, fn ) { var r = [], i; for( i = 0; i < arr.length; ++i ) r.push( fn(arr[i]) ); return r; }
    function forin( obj, fn ) { for( var p in obj ) if ( obj.hasOwnProperty(p) ) fn( p, obj[p] ); }
    function emptyfn() {}
    function clone( obj ) { var copy = {}; forin( obj, function( p, v ) { copy[p] = v; } ); return copy; }
    function plan( fn, context, time ) { 
        var args = Array.prototype.slice.call(arguments, 3); 
        var timer = setTimeout( function() { 
            fn.apply(context, args); 
        }, time); 
        return {
            cancel: function() { clearTimeout(timer); }
        }
    }
    function pop( obj, prop ) { var value = obj[prop]; delete obj[prop]; return value; }
    function killundefined(value) { return value || 0; }



    var ua = /Chrome|Firefox|IE|Safari|Opera/.exec(window.navigator.userAgent)

      , perfix = {
        'Chrome' : '-webkit-',
        'Safari' : '-webkit-',
        'Firefox' : '-moz-',
        'IE' : '-ms-',
        'Opera' : '-o-' }[ua] || ''
     

     , speedTable = {
        fast: 300,
        normal: 500,
        slow: 800
     }
        
     , easingTable = { 
        //https://github.com/louisremi/jquery.transition.js
        linear:         "linear",
        ease:           "ease",
        swing:          "ease-out",
        bounce:         "cubic-bezier(0,.35,.5,1.3)"
    };

    function doAnimate( dom, prop /* , speed, ease, callback */ ) {
        if( !(dom instanceof HTMLElement) ) return;
        var args = Array.prototype.slice.call( arguments, 2 )
          , speed , ease , callback
          , i , arg
          , transform;

        for(i = 0; i < args.length; i++) {
            arg = args[i];
            switch( typeof(args[i]) ) {
                case 'function':
                    callback = arg;
                    break;
                case 'string':
                    args[i] in speedTable 
                        && ( speed = speedTable[ arg ] ) 
                        || ( ease = easingTable[ arg ] || arg );
                    break;
                case 'number':
                    speed = args[i];
                    break;
            }
        }

        speed = speed || 300;
        ease = ease || 'ease';
        callback = callback || emptyfn;

        setTransition( dom, speed, ease );

        if ( typeof( prop ) == 'string' ) {
            changeClass( dom, prop );
        }
        else {
            setStyles( dom, prop );
        }

        plan(callback, dom, speed);
    }

    function clearAnimate( dom ) {
        removeTransition(dom);
    }

    function setTransition( dom, speed, ease ) {
        dom.style[perfix + 'transition'] = ['all', speed + 'ms', ease].join(' ');
        if( dom._transitionPlan ) dom._transitionPlan.cancel();
        dom._transitionPlan = plan(removeTransition, dom, speed, dom);
    }

    function removeTransition( dom ) {
        dom.style.removeProperty(perfix + 'transition');
    }

    function getOriginTransform( dom ) {
        var name = perfix + 'transform';
        var inline = extractProperties( dom.style.getPropertyValue( name ) );
        var rules = window.getMatchedCSSRules( dom );
        for( var i = 0; i < rules.length; i++) {
            if(rules[i].style[name].length) {
                inline = mergeProperties( extractProperties(rules[i].style[name]), inline );
            }
        }
        return inline;
    }

    function mapTransform( dom, prop ) {
        var names = ['translate', 'rotate', 'scale', 'skew', 'perspective'],
            alixs  = ['X', 'Y', 'Z'];
        var i, j, name, p, origin, transform;

        origin = getOriginTransform( dom );
        if( 'translate3d' in origin) origin['translate'] = pop(origin, 'translate3d');
        transform = {};

        if( 'x' in prop ) {
            transform['translate'] = [pop(prop, 'x')];
        }
        if( 'y' in prop ) {
            transform['translate'] = transform['translate'] || [];
            transform['translate'][1] = pop(prop, 'y');
        }

        for(i = 0; i < names.length; i++) {
            name = names[i];

            if( name in prop ) transform[name] = pop(prop, name);

            for(j = 0; j < alixs.length; j++) {
                p = name + alixs[j];
                if( p in prop ) {
                    transform[ name ] = transform[ name ] || [];
                    transform[ name ][ j ] = pop( prop, p );
                }
            }
        }

        transform = mergeProperties(origin, transform);
        transform['translate3d'] = mergeProperties( [0,0,0], pop(transform,'translate'), 'px' ); // accelerate
        transform = encodeProperties( transform );
        prop[ perfix + 'transform' ] = transform;
    }

    function mergeProperties( source, target, unit ) {
        if ( typeof(target) == 'number' ) target = target.toString();
        if ( typeof(target) == 'string' ) {
            unit = detectUnit(source) || detectUnit(target) || unit || '';
            if(target.charAt(0) == '+') {
                return parseFloat(source || 0, 10) + parseFloat(target.substr(1), 10) + unit;
            } else {
                return parseFloat(target, 10) + unit;
            }
        }
        if( target instanceof Array ) {
            source = source || [];
            for(var i = 0; i < target.length; i++) {
                source[i] = mergeProperties(source[i], target[i], unit);
            }
            return source;
        }
        forin(target, function(p, v) {
            source[p] = mergeProperties(source[p], target[p], !~p.indexOf('scale') && 'px');
        });
        return source;
    }

    function extractProperties( str ) {
        var patten = /\b(\w+?)\b\((.+?)\)/gi
          , match
          , obj = {};
        while( match = patten.exec(str) ) {
            obj[match[1]] = map( match[2].split(','), trim );
        }
        return obj;
    }

    function encodeProperties( obj ) {
        var str = '';
        forin( obj, function( prop, arr ) {
            if( arr instanceof Array ) {
                arr = map(arr, killundefined);
                str += prop + '(' + arr.join(',') + ') ';
            }
        });
        return str;
    }

    function detectUnit( str ) {
        if(!str) return undefined;
        var match = /[a-zA-Z%]+/.exec(str);
        return match && match[0];
    }

    function setStyles( dom, prop ) {
        if( !(dom instanceof HTMLElement) ) return;
        prop = clone( prop );
        mapTransform( dom, prop );
        forin(prop, function( p, v ) {
            dom.style[p] = v;
        });
    }

    function changeClass( dom, rules ) {
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

    return {
        start: doAnimate,
        stop: removeTransition,
        css: setStyles,
        speedTable: speedTable,
        easingTable: easingTable
    };
})(window);