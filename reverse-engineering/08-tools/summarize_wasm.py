import re

def summarize_wasm_functions(wat_file_path, output_file_path):
    """
    Summarize WebAssembly Text Format (.wat) functions to reduce analysis complexity.
    Focuses on function signatures, key operations, and call patterns.
    """
    with open(wat_file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Split into functions (this is approximate for large files)
    # Look for function starts
    func_pattern = r'\(func \$([^)]+)\)(.*?)(?=\(func|\(export|\(data|\(memory|\Z)'
    functions = re.findall(func_pattern, content, re.DOTALL)

    summary_lines = []

    for func_name, func_body in functions[:5000]:  # Limit to first 5000 to avoid memory issues
        # Count key operations
        loads = len(re.findall(r'i32\.load|i64\.load|f32\.load|f64\.load', func_body))
        stores = len(re.findall(r'i32\.store|i64\.store|f32\.store|f64\.store', func_body))
        calls = re.findall(r'call \$(\w+)', func_body)
        webgl_calls = [c for c in calls if any(x in c.lower() for x in ['tex', 'draw', 'uniform', 'buffer', 'shader', 'program', 'framebuffer'])]
        branches = len(re.findall(r'br_if|if|loop|block', func_body))

        # Get function size (approximate)
        size = len(func_body.split('\n'))

        # Create summary line
        summary = f"(func ${func_name})  // Size: {size} lines, Loads: {loads}, Stores: {stores}, Branches: {branches}, Calls: {len(calls)}"
        if webgl_calls:
            summary += f", WebGL: {webgl_calls[:3]}..."
        if 'import' in func_body:
            summary += " [IMPORT]"

        summary_lines.append(summary)

    # Write summary
    with open(output_file_path, 'w', encoding='utf-8') as out:
        out.write("WebAssembly Function Summary\n")
        out.write("===========================\n\n")
        out.write(f"Total functions analyzed: {len(summary_lines)}\n\n")
        out.write("Format: (func $name) // Size: lines, Loads: count, Stores: count, Branches: count, Calls: count, [WebGL calls...]\n\n")
        out.write('\n'.join(summary_lines))

    print(f"Summary written to {output_file_path}")
    print(f"Reduced from ~300k lines to {len(summary_lines)} summary lines")

if __name__ == "__main__":
    # Usage
    summarize_wasm_functions(
        "/Users/burningstring/Desktop/weavy-app/assets/wasm",
        "/Users/burningstring/Desktop/weavy-app/wasm_summary.txt"
    )
