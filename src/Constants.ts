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
  (member_expression property: (property_identifier) @field-ref)
  (function_declaration name: (identifier) @function-def)
  (method_definition name: (property_identifier) @method-def)
  (variable_declarator 
    name: (identifier) @var-def
    type: (type_annotation) @type-ref)
    (call_expression
      function: [
        (identifier) @function-ref
        (member_expression
          object: (identifier) @method-obj
          property: (property_identifier) @method-def)
   ])
  `
  
  public static javaScriptQuery: string = ''

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
