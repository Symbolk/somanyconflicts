'use strict'

export class Constants {
  public static conflictMarkerOurs: string = '<<<<<<<'
  public static conflictMarkerBase: string = '|||||||'
  public static conflictMarkerTheirs: string = '======='
  public static conflictMarkerEnd: string = '>>>>>>>'

  public static typeScriptQuery: string = `
  (function_declaration name: (identifier) @function-def)
  (method_definition name: (property_identifier) @method-def)
  (class_declaration name: (type_identifier) @class-def)
  (public_field_definition name: (property_identifier) @field-def)
  (variable_declarator name: (identifier) @var-def)
    (call_expression
      function: [
        (identifier) @function-ref
        (member_expression
          property: (property_identifier) @method-def)
   ])
  `
}
