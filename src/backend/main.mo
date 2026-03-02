import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Mixins
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  public type UserProfile = {
    gstin : Text;
    pan : Text;
    mobile : Text;
    email : Text;
    website : Text;
    companyName : Text;
  };

  public type TaxRate = {
    id : Nat;
    name : Text;
    percentage : Nat;
    cgst : Nat;
    sgst : Nat;
    igst : Nat;
  };

  public type InvoiceItem = {
    productName : Text;
    sellingPrice : Nat;
    quantity : Nat;
    taxRateId : Nat;
    imageUrl : ?Text;
  };

  public type Invoice = {
    id : Text;
    customerName : Text;
    invoiceDate : Text;
    placeOfSupply : Text;
    copyType : Text;
    signatureUrl : ?Text;
    notes : ?Text;
    items : [InvoiceItem];
    taxRates : [TaxRate];
  };

  public type ExpenseCategory = {
    id : Text;
    name : Text;
  };

  public type Expense = {
    id : Text;
    amount : Nat;
    expenseDate : Text;
    category : Text;
    paymentType : Text;
    paymentDate : Text;
    notes : ?Text;
    placeOfSupply : Text;
  };

  // Comparison modules for sorting
  module Invoice {
    public func compare(i1 : Invoice, i2 : Invoice) : Order.Order {
      Text.compare(i1.id, i2.id);
    };
  };

  module Expense {
    public func compare(e1 : Expense, e2 : Expense) : Order.Order {
      Text.compare(e1.id, e2.id);
    };
  };

  // Storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextInvoiceNumber = 1;
  var nextExpenseNumber = 1;

  let invoices = Map.empty<Principal, Map.Map<Text, Invoice>>();
  let invoiceCategories = Map.empty<Principal, List.List<TaxRate>>();

  let expenses = Map.empty<Principal, Map.Map<Text, Expense>>();
  let expenseCategories = Map.empty<Principal, List.List<ExpenseCategory>>();

  // Helper functions
  func getUserInvoices(caller : Principal) : Map.Map<Text, Invoice> {
    switch (invoices.get(caller)) {
      case (?userInvoices) { userInvoices };
      case (null) {
        let newInvoices = Map.empty<Text, Invoice>();
        invoices.add(caller, newInvoices);
        newInvoices;
      };
    };
  };

  func getUserTaxRates(caller : Principal) : List.List<TaxRate> {
    switch (invoiceCategories.get(caller)) {
      case (?rates) { rates };
      case (null) {
        let newRates = List.empty<TaxRate>();
        invoiceCategories.add(caller, newRates);
        newRates;
      };
    };
  };

  func getUserExpenseCategories(caller : Principal) : List.List<ExpenseCategory> {
    switch (expenseCategories.get(caller)) {
      case (?categories) { categories };
      case (null) {
        let newCategories = List.empty<ExpenseCategory>();
        expenseCategories.add(caller, newCategories);
        newCategories;
      };
    };
  };

  func getUserExpenses(caller : Principal) : Map.Map<Text, Expense> {
    switch (expenses.get(caller)) {
      case (?userExpenses) { userExpenses };
      case (null) {
        let newExpenses = Map.empty<Text, Expense>();
        expenses.add(caller, newExpenses);
        newExpenses;
      };
    };
  };

  // Helper function to format serial numbers with leading zeros
  func formatSerialNumber(prefix : Text, number : Nat) : Text {
    let numText = number.toText();
    let numLength = numText.size();

    var zeros = "";
    let requiredLength = 4 - Nat.min(numLength, 4);
    var i = 0;
    while (i < requiredLength) {
      zeros #= "0";
      i += 1;
    };

    prefix # "-" # zeros # numText;
  };

  // User Profile - Required interface functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Legacy profile functions (keeping for backward compatibility)
  public shared ({ caller }) func updateProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Invoices
  public shared ({ caller }) func createInvoice(invoice : Invoice) : async Invoice {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };

    let invoiceId = formatSerialNumber("INV", nextInvoiceNumber);
    nextInvoiceNumber += 1;

    let newInvoice : Invoice = {
      invoice with
      id = invoiceId;
      taxRates = getUserTaxRates(caller).toArray();
    };

    let userInvoices = getUserInvoices(caller);
    userInvoices.add(invoiceId, newInvoice);
    newInvoice;
  };

  public query ({ caller }) func getInvoice(id : Text) : async ?Invoice {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    let userInvoices = getUserInvoices(caller);
    userInvoices.get(id);
  };

  public shared ({ caller }) func updateInvoice(invoice : Invoice) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update invoices");
    };

    let userInvoices = getUserInvoices(caller);
    userInvoices.add(invoice.id, invoice);
  };

  public shared ({ caller }) func deleteInvoice(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete invoices");
    };

    let userInvoices = getUserInvoices(caller);
    userInvoices.remove(id);
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    let userInvoices = getUserInvoices(caller);
    userInvoices.values().toArray().sort();
  };

  // Expenses
  public shared ({ caller }) func createExpense(expense : Expense) : async Expense {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create expenses");
    };

    let expenseId = formatSerialNumber("EXP", nextExpenseNumber);
    nextExpenseNumber += 1;

    let newExpense : Expense = {
      expense with id = expenseId;
    };

    let userExpenses = getUserExpenses(caller);
    userExpenses.add(expenseId, newExpense);
    newExpense;
  };

  public query ({ caller }) func getExpense(id : Text) : async ?Expense {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let userExpenses = getUserExpenses(caller);
    userExpenses.get(id);
  };

  public shared ({ caller }) func updateExpense(expense : Expense) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update expenses");
    };

    let userExpenses = getUserExpenses(caller);
    userExpenses.add(expense.id, expense);
  };

  public shared ({ caller }) func deleteExpense(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let userExpenses = getUserExpenses(caller);
    userExpenses.remove(id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let userExpenses = getUserExpenses(caller);
    userExpenses.values().toArray().sort();
  };

  // Tax Rate Management
  public shared ({ caller }) func addTaxRate(rate : TaxRate) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add tax rates");
    };

    let rates = getUserTaxRates(caller);
    rates.add(rate);
  };

  public query ({ caller }) func getTaxRates() : async [TaxRate] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tax rates");
    };
    getUserTaxRates(caller).toArray();
  };

  // Expense Category Management
  public shared ({ caller }) func addExpenseCategory(category : ExpenseCategory) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add expense categories");
    };

    let categories = getUserExpenseCategories(caller);
    categories.add(category);
  };

  public query ({ caller }) func getExpenseCategories() : async [ExpenseCategory] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view expense categories");
    };
    getUserExpenseCategories(caller).toArray();
  };
};
