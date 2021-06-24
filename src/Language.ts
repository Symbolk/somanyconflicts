'use strict'

export const languages = {
  'Java': {
    create: () => require('tree-sitter-java'),
    queryString: `
      (comment) @comment
      (class_declaration name: (identifier) @type-def)
      (field_declaration (variable_declarator name: (identifier) @field-def))
      (field_access field: (identifier) @field-ref)
      (method_declaration name: (identifier) @method-def)
      (method_invocation name: (identifier) @method-ref)
      (local_variable_declaration type: (type_identifier) @type-ref
      declarator: (variable_declarator name: (identifier)) @var-def)
      (object_creation_expression type: (type_identifier) @type-ref)
      (type_arguments (type_identifier) @type-ref)
    `,
  },
  'JavaScript': {
    create: () => require('tree-sitter-javascript'),
    queryString: `
      (comment) @comment
      (class_declaration name: (identifier) @type-def)
      (public_field_definition name: (property_identifier) @field-def)
      (labeled_statement label: (statement_identifier) @field-def)
      (function_declaration name: (identifier) @function-def)
      (method_definition name: (property_identifier) @method-def)
      (variable_declarator name: (identifier) @var-def)
      (for_in_statement left: (identifier) @var-def)
      (array_pattern (identifier) @var-def)
      (object_pattern [
        (pair_pattern value: (identifier) @var-def)
        (shorthand_property_identifier_pattern) @var-def
      ])
      (call_expression
        function: [
          (identifier) @function-ref
          (member_expression
            object: (identifier) @method-obj
            property: (property_identifier) @method-ref)
        ]
      )
      (new_expression
        constructor: (identifier) @type-ref
      )
      (member_expression property: (property_identifier) @field-ref)
      (identifier) @var-ref
    `,
  },
  'TypeScript': {
    create: () => require('tree-sitter-typescript').typescript,
    queryString: `
      (comment) @comment
      (class_declaration name: (type_identifier) @type-def)
      (type_alias_declaration name: (type_identifier) @type-def)
      (interface_declaration name: (type_identifier) @type-def)
      (public_field_definition name: (property_identifier) @field-def)
      (labeled_statement label: (statement_identifier) @field-def)
      (function_declaration name: (identifier) @function-def)
      (generator_function_declaration name: (identifier) @function-def)
      (method_definition name: (property_identifier) @method-def)
      (variable_declarator
        name: (identifier) @var-def
        type: (type_annotation)? @type-ref
      )
      (for_in_statement left: (identifier) @var-def)
      (array_pattern (identifier) @var-def)
      (object_pattern [
        (pair_pattern value: (identifier) @var-def)
        (shorthand_property_identifier_pattern) @var-def
      ])
      (internal_module (identifier) @var-def)
      (call_expression
        function: [
          (identifier) @function-ref
          (member_expression
            object: [(identifier) (non_null_expression)] @method-obj
            property: (property_identifier) @method-ref)
        ]
      )
      (member_expression property: (property_identifier) @field-ref)
      (new_expression
        constructor: (identifier) @type-ref
      )
      (type_identifier) @type-ref
      (identifier) @var-ref
    `,
  },
  'Python': {
    create: () => require('tree-sitter-python'),
    queryString: `
    (comment) @comment
    (class_definition name: (identifier) @type-def)
    (function_definition name: (identifier) @function-def)
    (call
      function: [
      (identifier) @function-ref
      (attribute 
        object: (identifier) @method-obj
        attribute: (identifier) @method-ref)
       ]
      )
     (attribute 
        object: (identifier) @type-ref 
        attribute: (identifier) @field-ref)
    (identifier) @var-ref
    `,
  },
  'Unknown': {
    create: () => {},
    queryString: ``,
  }
} as const

export type Language = keyof typeof languages
