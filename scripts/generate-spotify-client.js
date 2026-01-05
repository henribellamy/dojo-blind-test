import { mkdir, writeFile } from "fs/promises";
import openapi from "../openapi.json" assert { type: 'json' };

const targetDirectory = "src/lib/spotify/model";

/**
 * Génère les types TypeScript à partir de la spécification OpenAPI
 */
async function generateSpotifyClient() {
  console.log("\nLaunched generate-spotify-client script");
  console.log('Generating Spotify client from OpenApi spec file...\n');
  
  await mkdir(targetDirectory, { recursive: true });
  
  const schemas = openapi.components.schemas;
  const typesToGenerate = Object.keys(schemas);
  
  for (const typeName of typesToGenerate) {
    const typeSchema = schemas[typeName];
    await generateType(typeName, typeSchema);
  }
  
  console.log('\n✓ Generation completed successfully!');
}

async function generateType(typeName, typeSchema) {  
  console.log(`Generating type ${typeName}...`);
  
  const imports = new Set();
  const generatedCode = getGeneratedCode(typeName, typeSchema, imports);
  
  const importStatements = Array.from(imports)
    .map((imp) => `import { ${imp} } from "./${imp}";`)
    .join("\n");
  
  const fileContent = importStatements 
    ? `${importStatements}\n\n${generatedCode}`
    : generatedCode;
  
  await writeFile(`${targetDirectory}/${typeName}.ts`, fileContent);
}

function getGeneratedCode(typeName, typeSchema, imports) {
  const generatedType = getGeneratedType(typeSchema, imports);
  return `export type ${typeName} = ${generatedType};`;
}

/**
 * Fonction récursive qui génère le type TypeScript
 */
function getGeneratedType(typeSchema, imports) {
  // $ref
  if (typeSchema.$ref) {
    const refType = typeSchema.$ref.split("/").pop();
    imports.add(refType);
    return refType;
  }
  
  // oneOf
  if (typeSchema.oneOf) {
    const unionTypes = typeSchema.oneOf.map(subSchema =>
      getGeneratedType(subSchema, imports)
    );
    return `(${unionTypes.join(" | ")})`;
  }
  
  // allOf
  if (typeSchema.allOf) {
    const intersectionTypes = typeSchema.allOf.map(subSchema =>
      getGeneratedType(subSchema, imports)
    );
    return intersectionTypes.join(" & ");
  }
  
  const schemaType = typeSchema.type;
  
  // array
  if (schemaType === "array" && typeSchema.items) {
    const itemType = getGeneratedType(typeSchema.items, imports);
    return `${itemType}[]`;
  }
  
  // object inline
  if (!schemaType && typeSchema.properties) {
    return getGeneratedType({ ...typeSchema, type: "object" }, imports);
  }
  
  // types simples et objects
  switch (schemaType) {
    case "number":
    case "integer":
      return "number";
      
    case "string":
      // ÉNUMÉRATIONS - AJOUT CRUCIAL
      if (typeSchema.enum) {
        return typeSchema.enum.map(v => `"${v}"`).join(" | ");
      }
      return "string";
      
    case "boolean":
      return "boolean";
      
    case "object":
      if (!typeSchema.properties) return "{}";
      
      const requiredFields = typeSchema.required || [];
      const properties = Object.entries(typeSchema.properties)
        .map(([propName, propSchema]) => {
          const propType = getGeneratedType(propSchema, imports);
          const optionalMark = requiredFields.includes(propName) ? "" : "?";
          return `  ${propName}${optionalMark}: ${propType};`;
        })
        .join("\n");
      
      return `{\n${properties}\n}`;
      
    default:
      return "any";
  }
}

generateSpotifyClient();




