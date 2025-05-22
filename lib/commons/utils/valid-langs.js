/* global axe */
/*eslint quotes: 0*/
var langs = [null,null,null,null,[null,null,null,null,null,[[true]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[true]],null,null,null,null,[[true]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[true]]],null,null,null,[null,[[true]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[true]]],null,null,null,null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[false]]];

/**
 * Determine if a string is a valid language code
 * @method isValidLang
 * @memberof axe.utils
 * @param {String} lang String to test if a valid language code
 * @returns {Boolean}
 */
function isValidLang(lang) {
	let array = langs;
	while (lang.length < 3) {
		lang += '`';
	}
	for (let i = 0; i <= lang.length - 1; i++) {
		const index = lang.charCodeAt(i) - 96;
		array = array[index];
		if (!array) {
			return false;
		}
	}
	return true;
}

/**
 * Returns array of valid language codes
 * @method validLangs
 * @memberof axe.utils
 * @return {Array<String>} Valid language codes
 */
function _validLangs(langArray) {
	langArray = Array.isArray(langArray) ? langArray : langs;
	const codes = [];
	langArray.forEach((lang, index) => {
		const char = String.fromCharCode(index + 96).replace('`', '');
		if (Array.isArray(lang)) {
			codes.push(..._validLangs(lang).map(newLang => char + newLang));
		} else if (lang) {
			codes.push(char);
		}
	});
	return codes;
}

axe.utils.validLangs = function () {
	return _validLangs();
};

export default isValidLang;
