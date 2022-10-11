//////////////////////////////////////////////////////
'use strict';

class vec3 {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}


function clamp(x, minimum, maximum) {
	if (x < minimum) {
		x = minimum;
	} else if (x > maximum) {
		x = maximum;
	}
	return x;
}


function srgb2oklab(rgb) {
	var l = 0.4122214708 * rgb.x + 0.5363325363 * rgb.y + 0.0514459929 * rgb.z;
	var m = 0.2119034982 * rgb.x + 0.6806995451 * rgb.y + 0.1073969566 * rgb.z;
	var s = 0.0883024619 * rgb.x + 0.2817188376 * rgb.y + 0.6299787005 * rgb.z;

	var l_ = Math.cbrt(l);
	var m_ = Math.cbrt(m);
	var s_ = Math.cbrt(s);

	return new vec3(
		0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
	);
}



function oklab2srgb(oklab) {
	var l_ = oklab.x + 0.3963377774 * oklab.y + 0.2158037573 * oklab.z;
	var m_ = oklab.x - 0.1055613458 * oklab.y - 0.0638541728 * oklab.z;
	var s_ = oklab.x - 0.0894841775 * oklab.y - 1.2914855480 * oklab.z;

	var l = l_ * l_ * l_;
	var m = m_ * m_ * m_;
	var s = s_ * s_ * s_;

	return new vec3(
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	);
}



function func_a(x, v, a) {
	var y1 = x * x + (2.0 + v) * x - v;
	var y2 = (1.0 + a) * x - a * v;
	return Math.min(y1, y2);
}



function func_b(x, v, a) {
	var y1 = -x * x + (1.0 + v) * x;
	var y2 = (1.0 + a) * x - a * v;
	return Math.max(y1, y2);
}



function func_c(x, v, a) {
	var y1 = x * x - v * x + v;
	var y2 = (1.0 - a) * x + a * v;
	return Math.min(y1, y2);
}



function func_d(x, v, a) {
	var y1 = x * x + (1.0 - v) * x;
	var y2 = (1.0 - a) * x + a * v;
	return Math.max(y1, y2);
}



function func_e(x, v1, v2, a) {
	var y1 = (1.0 - v1 + v2) * x + (v1 - v2);
	var y2 = x + (v1 - v2) * a;
	return Math.min(y1, y2);
}



function func_f(x, v1, v2, a) {
	var y1 = (1.0 - v1 + v2) * x;
	var y2 = x + (v1 - v2) * a;
	return Math.max(y1, y2);
}



function color_correction_core(rgb_in, alpha, beta, gamma) {
	var rgb_out = new vec3(rgb_in.x, rgb_in.y, rgb_in.z);

	if (alpha > 0.0) {
		rgb_out.x = func_a(rgb_in.x, Math.max(rgb_in.y, rgb_in.z), alpha);
	}
	else {
		rgb_out.x = func_b(rgb_in.x, Math.max(rgb_in.y, rgb_in.z), alpha);
	}

	if (rgb_in.y > rgb_in.z) {
		if (beta > 0.0)
			rgb_out.y = func_c(rgb_in.y, rgb_in.x, beta);
		else
			rgb_out.y = func_d(rgb_in.y, rgb_in.x, beta);

		if (gamma > 0.0)
			rgb_out.z = func_e(rgb_in.z, rgb_in.x, rgb_in.y, gamma);
		else
			rgb_out.z = func_f(rgb_in.z, rgb_in.x, rgb_in.y, gamma);

	}
	else {
		if (beta > 0.0)
			rgb_out.z = func_c(rgb_in.z, rgb_in.x, gamma);
		else
			rgb_out.z = func_d(rgb_in.z, rgb_in.x, gamma);

		if (gamma > 0.0)
			rgb_out.y = func_e(rgb_in.y, rgb_in.x, rgb_in.z, beta);
		else
			rgb_out.y = func_f(rgb_in.y, rgb_in.x, rgb_in.z, beta);

	}

	return rgb_out;
}



function reddish_correction(_rgb_in, _alpha, _beta, _gamma) {
	var rgb_in = new vec3(_rgb_in.x, _rgb_in.y, _rgb_in.z);

	var alpha = _alpha;
	var beta = _beta;
	var gamma = _gamma;

	var rgb_out = color_correction_core(rgb_in, alpha, beta, gamma);

	var _rgb_out = new vec3(rgb_out.x, rgb_out.y, rgb_out.z);

	return _rgb_out;
}



function greenish_correction(_rgb_in, _alpha, _beta, _gamma) {
	var rgb_in = new vec3(_rgb_in.y, _rgb_in.x, _rgb_in.z);	

	var alpha = _beta;
	var beta = _alpha;
	var gamma = _gamma;

	var rgb_out = color_correction_core(rgb_in, alpha, beta, gamma);

	var _rgb_out = new vec3(rgb_out.y, rgb_out.x, rgb_out.z);

	return _rgb_out;
}



function bluish_correction(_rgb_in, _alpha, _beta, _gamma) {
	var rgb_in = new vec3(_rgb_in.z, _rgb_in.x, _rgb_in.y);		
	
	var alpha = _gamma;
	var beta = _alpha;
	var gamma = _beta;

	var rgb_out = color_correction_core(rgb_in, alpha, beta, gamma);

	var _rgb_out = new vec3(rgb_out.y, rgb_out.z, rgb_out.x);

	return _rgb_out;
}


function color_correction(rgb_in,
	red_delta_red, red_delta_green, red_delta_blue,
	green_delta_red, green_delta_green, green_delta_blue,
	blue_delta_red, blue_delta_green, blue_delta_blue) {

	var rgb_out = new vec3(rgb_in.x, rgb_in.y, rgb_in.z);
	//RED
	if (rgb_in.x > rgb_in.y) {
		if (rgb_in.x > rgb_in.z) {
			rgb_out = reddish_correction(rgb_in, red_delta_red, red_delta_green, red_delta_blue);
		}
	}
	//GREEN
	if (rgb_in.y > rgb_in.x) {
		if (rgb_in.y > rgb_in.z) {
			rgb_out = greenish_correction(rgb_in, green_delta_red, green_delta_green, green_delta_blue);
		}
	}
	//BLUE
	if (rgb_in.z > rgb_in.x) {
		if (rgb_in.z > rgb_in.y) {
			rgb_out = bluish_correction(rgb_in, blue_delta_red, blue_delta_green, blue_delta_blue);
		}
	}

	rgb_out.x = clamp(rgb_out.x, 0.0, 1.0);
	rgb_out.y = clamp(rgb_out.y, 0.0, 1.0);
	rgb_out.z = clamp(rgb_out.z, 0.0, 1.0);

	return rgb_out;
}


function correct_color_oklab_core(rgb_in,
	delta_l, delta_a, delta_b,
  red_delta_red, red_delta_green, red_delta_blue,
	green_delta_red, green_delta_green, green_delta_blue,
	blue_delta_red, blue_delta_green, blue_delta_blue)
{
	var lab = srgb2oklab(rgb_in);	
    
	lab.x = lab.x + delta_l;
	lab.y = lab.y + delta_a;
	lab.z = lab.z + delta_b;	

	var rgb_ = oklab2srgb(lab);
	
	var rgb_out = color_correction(rgb_,
	  red_delta_red, red_delta_green, red_delta_blue,
	  green_delta_red, green_delta_green, green_delta_blue,
	  blue_delta_red, blue_delta_green, blue_delta_blue);	  
   
	return rgb_out;
}



//////////////////////////////////////////////////////

function correct_color_oklab() {
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	for (var i = 0; i < data.length; i += 4) {
		let red = data[i], green = data[i + 1], blue = data[i + 2];    
    
    var rgb_in = new vec3(red / 255.0, green / 255.0, blue / 255.0);   

    var rgb_out = correct_color_oklab_core(rgb_in,
      0.0, 0.0, 0.2, 
      0.0, 0.0, 0.0, 
      0.0, 0.0, 0.0, 
      0.0, 0.0, 0.0);            

    data[i] = clamp(rgb_out.x * 255.0, 0.0, 255.0);
    data[i + 1] = clamp(rgb_out.y * 255.0, 0.0, 255.0);
    data[i + 2] = clamp(rgb_out.z * 255.0, 0.0, 255.0);    
	}
	ctx.putImageData(imageData, 0, 0);
}


function butotnClick(){  
  correct_color_oklab();
  alert('Click');
}

let button = document.getElementById("changecolor_button");
button.onclick = butotnClick;

