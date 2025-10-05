export default function Landing() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-rfl-navy mb-3">Rotary Fitness League</h1>
        <p className="text-gray-700 mb-8">Sign up or log in with your first and last name to get started.</p>
        <div className="grid grid-cols-1 gap-4">
          <a href="/signin" className="inline-block px-6 py-3 rounded-md bg-rfl-navy text-white font-medium">Log In</a>
          <a href="/signup" className="inline-block px-6 py-3 rounded-md bg-rfl-coral text-white font-medium">Sign Up</a>
        </div>
      </div>
    </div>
  );
}