const KEYWORDS = {
	ts: [
		"const", "let", "var", "await", "async", "function", "return", "import", "from", "export",
		"default", "new", "class", "interface", "type", "if", "else", "for", "while", "try", "catch",
		"finally", "throw", "typeof", "instanceof", "extends", "implements", "public", "private",
		"protected", "readonly", "static", "void", "null", "undefined", "true", "false", "this", "super", "in", "of"
	],
	python: [
		"def", "import", "from", "return", "class", "if", "elif", "else", "for", "while", "try",
		"except", "finally", "as", "with", "in", "is", "not", "and", "or", "None", "True", "False",
		"self", "async", "await", "yield", "lambda", "pass", "break", "continue", "raise", "global", "nonlocal"
	],
	bash: ["if", "then", "else", "elif", "fi", "for", "do", "done", "while", "case", "esac", "function", "export", "local", "return", "in"],
	powershell: ["if", "else", "elseif", "foreach", "while", "function", "return", "param", "try", "catch", "finally", "switch"],
	env: [],
};
KEYWORDS.js = KEYWORDS.ts;
KEYWORDS.tsx = KEYWORDS.ts;
KEYWORDS.jsx = KEYWORDS.ts;

const COMMENT_CHAR = {
	ts: "//", js: "//", tsx: "//", jsx: "//",
	bash: "#", powershell: "#", env: "#", python: "#",
};

function escapeHtml(str) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lightweight, dependency-free tokenizer: colors comments, strings, numbers,
// shell variables, function calls, and keywords to match the site's existing palette.
export function highlight(code, lang = "text") {
	if (!code) return "";

	const safeLang = (lang || "text").toLowerCase();
	if (safeLang === "text") return escapeHtml(code);

	const keywords = KEYWORDS[safeLang] || [];
	const commentChar = Object.prototype.hasOwnProperty.call(COMMENT_CHAR, safeLang) ? COMMENT_CHAR[safeLang] : "#";

	const parts = [];
	if (commentChar) parts.push("(?<comment>" + escapeRegExp(commentChar) + ".*$)");
	parts.push("(?<string>'(?:\\\\.|[^'\\\\])*'|\"(?:\\\\.|[^\"\\\\])*\"|`(?:\\\\.|[^`\\\\])*`)");
	if (safeLang === "bash" || safeLang === "powershell") parts.push("(?<variable>\\$\\{[^}]+\\}|\\$[A-Za-z_][A-Za-z0-9_]*)");
	parts.push("(?<number>\\b\\d+(?:\\.\\d+)?\\b)");
	parts.push("(?<func>\\b[A-Za-z_$][A-Za-z0-9_$]*(?=\\())");
	if (keywords.length) parts.push("(?<keyword>\\b(?:" + keywords.map(escapeRegExp).join("|") + ")\\b)");

	const master = new RegExp(parts.join("|"), "gm");

	let result = "";
	let lastIndex = 0;
	let match;

	while ((match = master.exec(code)) !== null) {
		result += escapeHtml(code.slice(lastIndex, match.index));
		const groups = match.groups || {};
		const text = escapeHtml(match[0]);

		if (groups.comment) result += '<span class="text-zinc-500">' + text + "</span>";
		else if (groups.string) result += '<span class="text-green-400">' + text + "</span>";
		else if (groups.variable) result += '<span class="text-amber-400">' + text + "</span>";
		else if (groups.number) result += '<span class="text-amber-400">' + text + "</span>";
		else if (groups.func) result += '<span class="text-amber-400">' + text + "</span>";
		else if (groups.keyword) result += '<span class="text-rose-400">' + text + "</span>";
		else result += text;

		lastIndex = master.lastIndex;
	}

	result += escapeHtml(code.slice(lastIndex));
	return result;
}
