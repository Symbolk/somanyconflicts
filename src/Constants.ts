'use strict'

export class Constants {
  public static conflictMarkerOurs: string = '<<<<<<<'
  public static conflictMarkerBase: string = '|||||||'
  public static conflictMarkerTheirs: string = '======='
  public static conflictMarkerEnd: string = '>>>>>>>'

  public static typeScriptQuery: string = `
  (class_declaration name: (type_identifier) @type-def)
  (public_field_definition name: (property_identifier) @field-def)
  (labeled_statement label: (statement_identifier) @field-def)
  (function_declaration name: (identifier) @function-def)
  (generator_function_declaration name: (identifier) @function-def)
  (method_definition name: (property_identifier) @method-def)
  (variable_declarator
    name: (identifier) @var-def
    type: (type_annotation)? @type-ref
  )
  (array_pattern (identifier) @var-def)
  (object_pattern [
    (pair_pattern value: (identifier) @var-def)
    (shorthand_property_identifier_pattern) @var-def
  ])
  (call_expression
    function: [
      (identifier) @function-ref
      (member_expression
        object: [(identifier) (non_null_expression)] @method-obj
        property: (property_identifier) @method-ref)
    ]
    arguments: (arguments (identifier) @var-ref)*
  )
  (member_expression property: (property_identifier) @field-ref)
  (assignment_expression left: (identifier) @var-ref)
  (new_expression
    constructor: (identifier) @type-ref
  )
  (predefined_type) @type-ref
  (array_type (type_identifier) @type-ref)
  (comment) @comment
  (for_in_statement right: (identifier) @var-ref)
  (member_expression
    object: (identifier) @var-ref
    property: (property_identifier)
  )
  (subscript_expression
    object: (identifier) @var-ref
    index: (identifier)? @var-ref
  )
  (binary_expression
    left: (identifier)? @var-ref
    right: (identifier)? @var-ref
  )
  (type_annotation (type_identifier) @type-ref)
  (unary_expression argument: (identifier) @var-ref)
  (type_alias_declaration name: (type_identifier) @type-def)
  (type_annotation [(generic_type (type_identifier) @type-ref)
    (tuple_type (type_identifier) @type-ref)])
  (arguments (identifier) @var-ref)
  (type_arguments (type_identifier) @type-ref)
  (as_expression
    (identifier)? @var-ref
    (type_identifier)? @type-ref
  )
  (parenthesized_expression (identifier) @var-ref)
  (assignment_expression
    left: (identifier)? @var-ref
    right: (identifier)? @var-ref
  )
  (ternary_expression
    condition: (identifier)? @var-ref
    consequence: (identifier)? @var-ref
    alternative: (identifier)? @var-ref
  )
  (sequence_expression
    left: (identifier)? @var-ref
    right: (identifier)? @var-ref
  )
  (yield_expression (identifier) @var-ref)
  (return_statement (identifier) @var-ref)
  `

  public static javaScriptQuery: string = `
  (class_declaration name: (identifier) @type-def)
  (public_field_definition name: (property_identifier) @field-def)
  (labeled_statement label: (statement_identifier) @field-def)
  (function_declaration name: (identifier) @function-def)
  (method_definition name: (property_identifier) @method-def)
  (variable_declarator 
    name: [(identifier) @var-def
    (array_pattern (identifier) @var-def)]
  (call_expression
    function: [
      (identifier) @function-ref
      (member_expression
        object: (identifier) @method-obj
        property: (property_identifier) @method-ref)
    ]
    arguments: (arguments (identifier) @var-ref)*
  )
  (new_expression
    constructor: (identifier) @type-ref
  )
  (member_expression property: (property_identifier) @field-ref)
  (member_expression 
    object: (identifier) @var-ref
    property: (property_identifier))
  (assignment_expression left: (identifier) @var-ref)
  (assignment_expression 
    left: (identifier)* @var-ref
    right: (identifier)* @var-ref
  )
  (comment) @comment
  (for_in_statement right: (identifier) @var-ref)
  (subscript_expression
    object: (identifier) @var-ref
    index: (identifier)* @var-ref
  )
  (unary_expression argument: (identifier) @var-ref)
  (binary_expression
    left: (identifier)* @var-ref
    right: (identifier)* @var-ref
  )
  (arguments (identifier) @var-ref)
  (parenthesized_expression (identifier) @var-ref)
  (return_statement (identifier) @var-ref)`

  public static javaQuery: string = `
  (class_declaration name: (identifier) @type-def)
  (field_declaration (variable_declarator name: (identifier) @field-def))
  (field_access field: (identifier) @field-ref)
  (method_declaration name: (identifier) @method-def)
  (method_invocation name: (identifier) @method-ref)
  (local_variable_declaration type: (type_identifier) @type-ref
  declarator: (variable_declarator name: (identifier)) @var-def)
  (object_creation_expression type: (type_identifier) @type-ref)
  (type_arguments (type_identifier) @type-ref)
  `

  public static pythonQuery: string = ''
}
