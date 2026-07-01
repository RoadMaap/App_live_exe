import importlib.util
import inspect
import os
import sys
import ast

class StrategyLoader:
    def load_strategies_from_file(self, file_path):
        """
        کلاس‌های استراتژی را برای اجرا لود می‌کند.
        خروجی: دیکشنری شامل نام کلاس و آبجکت کلاس
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError("فایل پیدا نشد")

        module_name = os.path.basename(file_path).replace('.py', '')
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if not spec: raise ImportError("فرمت فایل نامعتبر است")
            
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module 
        
        try:
            spec.loader.exec_module(module)
        except Exception as e:
            raise ImportError(f"خطا در اجرای کد استراتژی: {e}")

        found_strategies = {}

        # پیدا کردن تمام کلاس‌هایی که متدهای لازم را دارند
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if hasattr(obj, 'check_entry_signal') and hasattr(obj, 'prepare_indicators'):
                if obj.__module__ == module_name:
                    found_strategies[name] = obj
        
        if not found_strategies:
            raise ValueError("هیچ کلاس استراتژی استانداردی یافت نشد.")
            
        return found_strategies

    def extract_params_for_classes(self, file_path):
        """
        کد را اسکن می‌کند تا تمام استفاده‌های self.params[...] را پیدا کند.
        این روش نیازی به تعریف اولیه پارامترها در __init__ ندارد.
        """
        with open(file_path, "r", encoding="utf-8") as f:
            source_code = f.read()
        
        tree = ast.parse(source_code)
        visitor = ParamUsageVisitor()
        visitor.visit(tree)
        return visitor.found_params

# کلاس کمکی برای اسکن دقیق کد
class ParamUsageVisitor(ast.NodeVisitor):
    def __init__(self):
        self.current_class = None
        self.found_params = {} # {ClassName: {param_name: default_value}}

    def visit_ClassDef(self, node):
        self.current_class = node.name
        if node.name not in self.found_params:
            self.found_params[node.name] = {}
        self.generic_visit(node)
        self.current_class = None

    # 1. پیدا کردن مقداردهی اولیه: self.params = { ... }
    def visit_Assign(self, node):
        if self.current_class and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
                if target.value.id == 'self' and target.attr == 'params':
                    if isinstance(node.value, ast.Dict):
                        for key, val in zip(node.value.keys, node.value.values):
                            k, v = self._extract_kv(key, val)
                            if k: self.found_params[self.current_class][k] = v
        self.generic_visit(node)

    # 2. پیدا کردن استفاده در کد: self.params['KEY']
    def visit_Subscript(self, node):
        if self.current_class:
            if isinstance(node.value, ast.Attribute) and isinstance(node.value.value, ast.Name):
                if node.value.value.id == 'self' and node.value.attr == 'params':
                    # استخراج نام کلید
                    key_name = self._extract_constant(node.slice)
                    if key_name:
                        # اگر قبلاً مقدار پیش‌فرضی براش پیدا نکردیم، موقتاً 0 می‌گذاریم
                        if key_name not in self.found_params[self.current_class]:
                            self.found_params[self.current_class][key_name] = 0
        self.generic_visit(node)

    # 3. پیدا کردن استفاده با get: self.params.get('KEY', default)
    def visit_Call(self, node):
        if self.current_class and isinstance(node.func, ast.Attribute):
            if node.func.attr == 'get' and isinstance(node.func.value, ast.Attribute):
                if isinstance(node.func.value.value, ast.Name) and node.func.value.value.id == 'self':
                    if node.func.value.attr == 'params':
                        # آرگومان اول: نام کلید
                        if len(node.args) >= 1:
                            key_name = self._extract_constant(node.args[0])
                            default_val = 0
                            # آرگومان دوم: مقدار پیش‌فرض
                            if len(node.args) >= 2:
                                default_val = self._extract_constant(node.args[1])
                            
                            if key_name:
                                self.found_params[self.current_class][key_name] = default_val
        self.generic_visit(node)

    def _extract_kv(self, key_node, val_node):
        k = self._extract_constant(key_node)
        v = self._extract_constant(val_node)
        return k, v

    def _extract_constant(self, node):
        if isinstance(node, ast.Constant): return node.value # Python 3.8+
        elif isinstance(node, ast.Str): return node.s
        elif isinstance(node, ast.Num): return node.n
        elif isinstance(node, ast.Index): return self._extract_constant(node.value) # Python < 3.9
        elif isinstance(node, ast.NameConstant): return node.value
        return None