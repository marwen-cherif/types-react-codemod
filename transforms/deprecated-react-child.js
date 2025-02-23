const parseSync = require("./utils/parseSync");

/**
 * @type {import('jscodeshift').Transform}
 */
const deprecatedReactChildTransform = (file, api) => {
	const j = api.jscodeshift;
	const ast = parseSync(file);

	const changedIdentifiers = ast
		.find(j.TSTypeReference, (node) => {
			const { typeName } = node;
			/**
			 * @type {import('jscodeshift').Identifier | null}
			 */
			let identifier = null;
			if (typeName.type === "Identifier") {
				identifier = typeName;
			} else if (
				typeName.type === "TSQualifiedName" &&
				typeName.right.type === "Identifier"
			) {
				identifier = typeName.right;
			}

			return identifier !== null && identifier.name === "ReactChild";
		})
		.replaceWith(() => {
			// `React.ReactElement | number | string`
			return j.tsUnionType([
				// React.ReactElement
				j.tsTypeReference(
					j.tsQualifiedName(j.identifier("React"), j.identifier("ReactElement"))
				),
				j.tsNumberKeyword(),
				j.tsStringKeyword(),
			]);
		});

	// Otherwise some files will be marked as "modified" because formatting changed
	if (changedIdentifiers.length > 0) {
		return ast.toSource();
	}
	return file.source;
};

export default deprecatedReactChildTransform;
